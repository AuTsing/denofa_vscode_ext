import * as WebSocket from 'ws';
import * as FsPromises from 'fs/promises';
import * as Path from 'path';
import Output from './Output';
import Asker from './Asker';
import Commander, { Commands, ProjectState, RemoveCommand, RunCommand, SnapshotCommand, StatusCommand, StopCommand, UploadCommand } from './Commander';
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
    private snapshoting: boolean;

    constructor(asker: Asker, commander: Commander, workspace: Workspace, storage: Storage) {
        this.asker = asker;
        this.commander = commander;
        this.workspace = workspace;
        this.storage = storage;
        this.wsc = null;
        this.connecting = false;
        this.snapshoting = false;
    }

    private async connect(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wsc) {
                this.disconnect();
            }
            this.storage.addWsUrl(url);
            const wsc = new WebSocket(url, { handshakeTimeout: 5000 });
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
                return;
            }
            this.wsc.send(message, e => {
                if (!e) {
                    resolve();
                } else {
                    reject(e);
                }
            });
        });
    }

    private async removeProject(): Promise<void> {
        const projectNames = [] as string[];

        const denoJson = await this.workspace.getDenoJson();
        const imports = Object.values(denoJson.imports ?? {});
        const localImports = imports.filter(it => typeof it === 'string' && it.startsWith('.')) as string[];
        const localImportNames = localImports.map(it => Path.basename(it));
        projectNames.push(...localImportNames);

        const workspaceFolder = this.workspace.getWorkspaceFolder();
        projectNames.push(workspaceFolder.name);

        for (const name of projectNames) {
            const cmd: RemoveCommand = {
                cmd: Commands.Remove,
                data: { name },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        }
    }

    private async uploadProject(): Promise<void> {
        const files = await this.workspace.getWrokspaceFiles();
        for (const file of files) {
            const buffer = await FsPromises.readFile(file.absolutePath);
            const cmd: UploadCommand = {
                cmd: Commands.Upload,
                data: {
                    dst: file.remotePath,
                    file: Array.from(new Uint8Array(buffer)),
                },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        }
    }

    private async getProjectStatus(): Promise<ProjectState> {
        const workspaceFolder = this.workspace.getWorkspaceFolder();
        const name = workspaceFolder.name;

        const cmd: StatusCommand = {
            cmd: Commands.Status,
            data: {
                name,
                state: ProjectState.Free,
            },
        };
        const message = this.commander.adaptCommand(cmd);
        await this.send(message);
        const statusData = await this.commander.waitForStatusData();
        return statusData.state;
    }

    private async connectAutomatically(): Promise<void> {
        if (this.wsc) {
            return;
        }
        const doing = StatusBar.doing('连接中');
        try {
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

    private async snapshot(): Promise<Uint8Array> {
        const cmd: SnapshotCommand = {
            cmd: Commands.Snapshot,
            data: {
                success: true,
                message: '',
                file: [],
            },
        };
        const message = this.commander.adaptCommand(cmd);
        await this.send(message);
        const snapshotData = await this.commander.waitForSnapshotData();
        if (!snapshotData.success) {
            throw new Error(snapshotData.message);
        }
        return Uint8Array.from(snapshotData.file);
    }

    async handleConnect() {
        const doing = StatusBar.doing('连接中');
        try {
            if (this.connecting) {
                throw new Error('正在尝试连接设备中');
            }
            this.connecting = true;
            const url = await this.asker.askForWsUrlWithHistory();
            await this.connect(url);
            Output.println('连接设备成功:', url);
        } catch (e) {
            Output.eprintln('连接设备失败:', e);
        } finally {
            doing?.dispose();
            this.connecting = false;
        }
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
            const state = await this.getProjectStatus();
            if (state !== ProjectState.Free) {
                throw new Error('工程正在运行中');
            }
            await this.removeProject();
            await this.uploadProject();
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const name = workspaceFolder.name;
            const cmd: RunCommand = {
                cmd: Commands.Run,
                data: { name },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
            Output.println('运行工程成功:', name);
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
            await this.removeProject();
            await this.uploadProject();
            Output.println('工程已上传');
        } catch (e) {
            Output.eprintln('上传工程失败:', e);
        }
    }

    async handleSnapshot() {
        const doing = StatusBar.doing('截图中');
        try {
            if (this.snapshoting) {
                throw new Error('正在尝试屏幕截图中');
            }
            this.snapshoting = true;
            await this.connectAutomatically();
            const img = await this.snapshot();
            const saveDir = await this.asker.askForSnapshotSaveDir();
            const now = Date.now();
            const filename = `Snapshot_${now}.png`;
            const snapshotPng = Path.join(saveDir, filename);
            await FsPromises.writeFile(snapshotPng, img);
            Output.println('屏幕截图已保存至:', snapshotPng);
        } catch (e) {
            Output.eprintln('屏幕截图失败:', e);
        } finally {
            doing?.dispose();
            this.snapshoting = false;
        }
    }
}
