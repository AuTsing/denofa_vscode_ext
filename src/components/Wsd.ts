import * as WebSocket from 'ws';
import * as FsPromises from 'fs/promises';
import Output from './Output';
import Asker from './Asker';
import Commander, { Commands, RunCommand, StopCommand, UploadCommand } from './Commander';
import Workspace from './Workspace';
import StatusBar from './StatusBar';
import Storage from './Storage';

export default class Wsd {
    private readonly asker: Asker;
    private readonly commander: Commander;
    private readonly workspace: Workspace;
    private readonly storage: Storage;
    private wsc: WebSocket | null;
    private connecting: boolean;

    constructor(asker: Asker, commander: Commander, workspace: Workspace, storage: Storage) {
        this.asker = asker;
        this.commander = commander;
        this.workspace = workspace;
        this.storage = storage;
        this.wsc = null;
        this.connecting = false;
    }

    private async connect(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wsc) {
                this.disconnect();
            }
            this.storage.addWsUrl(url);
            const wsc = new WebSocket(url);
            wsc.on('open', () => {
                this.wsc = wsc;
                Output.println(`已连接设备: ${url}`);
                StatusBar.connected(url);
                resolve();
            });
            wsc.on('error', e => {
                reject(e);
            });
            wsc.on('close', () => {
                if (this.wsc) {
                    Output.println(`已断开设备: ${url}`);
                    StatusBar.disconnected(url);
                    this.wsc = null;
                }
            });
            wsc.on('message', message => {
                this.commander.handleMessage(message.toString('utf-8'));
            });
        });
    }

    private disconnect() {
        if (!this.wsc) {
            throw new Error('未连接设备');
        }
        this.wsc.terminate();
    }

    private async send(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.wsc) {
                reject('未连接设备');
            }
            this.wsc!.send(message, e => {
                if (!e) {
                    resolve();
                } else {
                    reject(e);
                }
            });
        });
    }

    private async uploadProject(): Promise<void> {
        const files = await this.workspace.getWrokspaceFiles();
        for (const file of files) {
            const buffer = await FsPromises.readFile(file.absolutePath);
            const cmd: UploadCommand = {
                cmd: Commands.Upload,
                data: {
                    dst: file.relativePath,
                    file: Array.from(new Uint8Array(buffer)),
                },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        }
    }

    private async connectAutomatically(): Promise<void> {
        const doing = StatusBar.doing('连接中');
        try {
            if (this.wsc) {
                return;
            }
            const urls = this.storage.getWsUrls();
            if (urls.length === 0) {
                throw new Error('未连接设备');
            }
            if (this.connecting) {
                throw new Error('正在尝试连接设备中');
            }
            this.connecting = true;
            const lastUrl = urls[urls.length - 1];
            Output.println(`未连接设备，尝试连接最后使用设备: ${lastUrl}`);
            await this.connect(lastUrl);
        } catch (e) {
            throw e;
        } finally {
            doing?.dispose();
            this.connecting = false;
        }
    }

    async handleConnect() {
        const doing = StatusBar.doing('连接中');
        try {
            if (this.connecting) {
                throw new Error('正在尝试连接设备中');
            }
            this.connecting = true;
            const url = await this.asker.askForWsUrl();
            await this.connect(url);
        } catch (e) {
            Output.eprintln('连接设备失败:', e);
        }
        doing?.dispose();
        this.connecting = false;
    }

    handleDisconnect() {
        try {
            this.disconnect();
        } catch (e) {
            Output.eprintln('断开设备失败:', e);
        }
    }

    async handleRun() {
        try {
            await this.connectAutomatically();
            await this.uploadProject();
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const name = workspaceFolder.name;
            const cmd: RunCommand = {
                cmd: Commands.Run,
                data: { name },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        } catch (e) {
            Output.eprintln('运行工程失败:', e);
        }
    }

    async handleStop() {
        try {
            await this.connectAutomatically();
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const name = workspaceFolder.name;
            const cmd: StopCommand = {
                cmd: Commands.Stop,
                data: { name },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        } catch (e) {
            Output.eprintln('停止工程失败:', e);
        }
    }

    async handleUpload() {
        try {
            await this.connectAutomatically();
            await this.uploadProject();
            Output.println('工程已上传');
        } catch (e) {
            Output.eprintln('上传工程失败:', e);
        }
    }
}
