import * as Vscode from 'vscode';
import * as Util from 'util';
import { DENORT_CLIENT_NAME } from '../values/Constants';

export default class Output {
    static instance?: Output;

    static println(...args: any[]) {
        this.instance?.println(...args);
    }

    static printlnAndShow(...args: any[]) {
        this.instance?.println(...args);
        this.instance?.show();
    }

    static eprintln(...args: any[]) {
        this.instance?.eprintln(...args);
    }

    private readonly channel: Vscode.LogOutputChannel;

    constructor() {
        this.channel = Vscode.window.createOutputChannel(DENORT_CLIENT_NAME, { log: true });
    }

    println(...args: any[]) {
        this.channel.info(Util.format(...args));
    }

    eprintln(...args: any[]) {
        this.channel.error(Util.format(...args));
        this.show();
    }

    show() {
        this.channel.show(true);
    }
}
