import Output from './Output';

export enum Commands {
    Run = 'run',
    Stop = 'stop',
    Upload = 'upload',
    Log = 'log',
}

export enum LogLevel {
    Info = 'Info',
    Warn = 'Warn',
    Error = 'Error',
}

interface BaseCommand {
    cmd: Command['cmd'];
    data: Command['data'];
}

export type Command = RunCommand | StopCommand | UploadCommand | LogCommand;

export interface RunCommand extends BaseCommand {
    cmd: Commands.Run;
    data: { name: string };
}

export interface StopCommand extends BaseCommand {
    cmd: Commands.Stop;
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

export default class Commander {
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
                default:
                    throw new Error(`不支持的命令: ${cmd.cmd}`);
            }
        } catch (e) {
            Output.eprintln(e);
        }
    }
}
