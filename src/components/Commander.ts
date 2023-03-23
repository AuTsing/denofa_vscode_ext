import * as Vscode from 'vscode';
import { EXTENSION_NS } from '../values/Constants';

export default class Commander {
    private context: Vscode.ExtensionContext;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
    }

    register(command: string, callback: () => any) {
        this.context.subscriptions.push(Vscode.commands.registerCommand(`${EXTENSION_NS}.${command}`, callback));
    }
}
