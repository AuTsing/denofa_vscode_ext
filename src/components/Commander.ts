import Output from './Output';
import StatusBar from './StatusBar';

export enum Commands {
    Run = 'run',
    Stop = 'stop',
    Remove = 'remove',
    Upload = 'upload',
    Log = 'log',
    StatusBar = 'statusBar',
    Snapshot = 'snapshot',
    Status = 'status',
    Result = 'result',
}

export enum LogLevel {
    Info = 'Info',
    Warn = 'Warn',
    Error = 'Error',
}

export enum ProjectState {
    Running = 'Running',
    Free = 'Free',
}

interface BaseCommand {
    cmd: Command['cmd'];
    data: Command['data'];
}

export type Command =
    | RunCommand
    | StopCommand
    | RemoveCommand
    | UploadCommand
    | LogCommand
    | StatusBarCommand
    | SnapshotCommand
    | StatusCommand
    | ResultCommand;

export interface RunCommand extends BaseCommand {
    cmd: Commands.Run;
    data: { name: string };
}

export interface StopCommand extends BaseCommand {
    cmd: Commands.Stop;
    data: { name: string };
}

export interface RemoveCommand extends BaseCommand {
    cmd: Commands.Remove;
    data: { name: string };
}

export interface UploadCommand extends BaseCommand {
    cmd: Commands.Upload;
    data: { dst: string; file: number[] };
}

export interface LogCommand extends BaseCommand {
    cmd: Commands.Log;
    data: { level: LogLevel; message: string };
}

export interface StatusBarCommand extends BaseCommand {
    cmd: Commands.StatusBar;
    data: { runningProjects: string[] };
}

export interface SnapshotCommand extends BaseCommand {
    cmd: Commands.Snapshot;
    data: { file: number[] };
}

export interface StatusCommand extends BaseCommand {
    cmd: Commands.Status;
    data: { name: string; state: ProjectState };
}

export interface ResultCommand extends BaseCommand {
    cmd: Commands.Result;
    data: { success: boolean; message: string };
}

export default class Commander {
    private snapshotConsumers: ((data: SnapshotCommand['data']) => void)[];
    private statusConsumers: ((data: StatusCommand['data']) => void)[];
    private resultConsumers: ((data: ResultCommand['data']) => void)[];

    constructor() {
        this.snapshotConsumers = [];
        this.statusConsumers = [];
        this.resultConsumers = [];
    }

    async waitForSnapshotData(): Promise<SnapshotCommand['data']> {
        return new Promise((resolve, _) => {
            this.snapshotConsumers.push(resolve);
        });
    }

    async waitForStatusData(): Promise<StatusCommand['data']> {
        return new Promise((resolve, _) => {
            this.statusConsumers.push(resolve);
        });
    }

    async waitForResultData(): Promise<ResultCommand['data']> {
        return new Promise((resolve, _) => {
            this.resultConsumers.push(resolve);
        });
    }

    resetSnapshotConsumers() {
        this.snapshotConsumers = [];
    }

    resetStatusConsumers() {
        this.statusConsumers = [];
    }

    resetResultConsumers() {
        this.resultConsumers = [];
    }

    adaptCommand(cmd: string): Command;
    adaptCommand(cmd: Command): string;
    adaptCommand(cmd: string | Command): Command | string {
        if (typeof cmd === 'string') {
            return JSON.parse(cmd) as Command;
        } else if (typeof cmd === 'object') {
            return JSON.stringify(cmd);
        } else {
            throw new Error(`不支持的命令: ${cmd}`);
        }
    }

    handleMessage(message: string) {
        console.log(message, this.resultConsumers);

        try {
            const cmd = this.adaptCommand(message);
            switch (cmd.cmd) {
                case Commands.Log:
                    switch (cmd.data.level) {
                        case LogLevel.Warn:
                            Output.wprintln(cmd.data.message);
                            break;
                        case LogLevel.Error:
                            Output.eprintln(cmd.data.message);
                            break;
                        case LogLevel.Info:
                        default:
                            Output.println(cmd.data.message);
                            break;
                    }
                    break;
                case Commands.StatusBar:
                    StatusBar.running(cmd.data.runningProjects);
                    break;
                case Commands.Snapshot:
                    this.snapshotConsumers.shift()?.(cmd.data);
                    break;
                case Commands.Status:
                    this.statusConsumers.shift()?.(cmd.data);
                    break;
                case Commands.Result:
                    this.resultConsumers.shift()?.(cmd.data);
                    break;
                default:
                    throw new Error(`不支持的命令: ${cmd.cmd}`);
            }
        } catch (e) {
            Output.eprintln(e);
        }
    }
}
