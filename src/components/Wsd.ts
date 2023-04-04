import * as WebSocket from 'ws';
import * as FsPromises from 'fs/promises';
import Output from './Output';
import Asker from './Asker';
import Commander, { Commands, RunCommand, StopCommand, UploadCommand } from './Commander';
import Workspace from './Workspace';

export default class Wsd {
    private readonly asker: Asker;
    private readonly commander: Commander;
    private readonly workspace: Workspace;
    private wsc: WebSocket | null;

    constructor(asker: Asker, commander: Commander, workspace: Workspace) {
        this.asker = asker;
        this.commander = commander;
        this.workspace = workspace;
        this.wsc = null;
    }

    private connect(url: string) {
        if (this.wsc) {
            this.disconnect();
        }
        const wsc = new WebSocket(url);
        wsc.on('open', () => {
            Output.printlnAndShow(`已连接设备: ${url}`);
            this.wsc = wsc;
        });
        wsc.on('error', (...err) => {
            Output.eprintln(...err);
            this.disconnect();
        });
        wsc.on('close', () => {
            Output.printlnAndShow(`已断开设备: ${url}`);
            this.wsc = null;
        });
        wsc.on('message', message => {
            this.commander.handleMessage(message.toString('utf-8'));
        });
    }

    private disconnect() {
        if (!this.wsc) {
            throw new Error('尚未连接设备');
        }
        this.wsc.terminate();
    }

    private async send(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.wsc) {
                reject('尚未连接设备');
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

    async handleConnect() {
        try {
            const url = await this.asker.askForWsUrl();
            this.connect(url);
        } catch (e) {
            Output.eprintln(e);
        }
    }

    handleDisconnect() {
        try {
            this.disconnect();
        } catch (e) {
            Output.eprintln(e);
        }
    }

    async handleRun() {
        try {
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
            Output.eprintln(e);
        }
    }

    async handleStop() {
        try {
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const name = workspaceFolder.name;
            const cmd: StopCommand = {
                cmd: Commands.Stop,
                data: { name },
            };
            const message = this.commander.adaptCommand(cmd);
            await this.send(message);
        } catch (e) {
            Output.eprintln(e);
        }
    }

    async handleUpload() {
        try {
            await this.uploadProject();
            Output.println('工程已上传');
        } catch (e) {
            Output.eprintln(e);
        }
    }
}
