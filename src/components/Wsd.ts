import * as WebSocket from 'ws';
import Output from './Output';
import Asker from './Asker';

enum Commands {
    Run = 'run',
    Stop = 'stop',
    Upload = 'upload',
    Log = 'log',
}

enum LogLevel {
    Info = 'Info',
    Warn = 'Warn',
    Error = 'Error',
}

interface BaseCommand {
    cmd: Command['cmd'];
    data: Command['data'];
}

type Command = RunCommand | StopCommand | UploadCommand | LogCommand;

interface RunCommand extends BaseCommand {
    cmd: Commands.Run;
    data: { name: string };
}

interface StopCommand extends BaseCommand {
    cmd: Commands.Stop;
    data: { name: string };
}

interface UploadCommand extends BaseCommand {
    cmd: Commands.Upload;
    data: { dst: string; file: Uint8Array };
}

interface LogCommand extends BaseCommand {
    cmd: Commands.Log;
    data: { level: LogLevel; message: string };
}

export default class Wsd {
    private readonly asker: Asker;
    private wsc: WebSocket | null;

    constructor(asker: Asker) {
        this.asker = asker;
        this.wsc = null;
    }

    private connect(url: string) {
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
            console.log(message);
        });
    }

    private disconnect() {
        this.wsc?.terminate();
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
        this.disconnect();
    }
}
