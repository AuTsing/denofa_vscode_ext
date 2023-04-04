import * as Vscode from 'vscode';
import { DENORT_NS } from '../values/Constants';

export default class Registry {
    private readonly context: Vscode.ExtensionContext;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
    }

    register(command: string, callback: () => any) {
        this.context.subscriptions.push(Vscode.commands.registerCommand(`${DENORT_NS}.${command}`, callback));
    }

    listenOnDidChangeConfiguration(listener: (e: Vscode.ConfigurationChangeEvent) => any) {
        this.context.subscriptions.push(Vscode.workspace.onDidChangeConfiguration(listener));
    }
}
