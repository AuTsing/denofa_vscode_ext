import * as Vscode from 'vscode';
import Commander from './components/Commander';
import Initializer from './components/Initializer';
import Output from './components/Output';

export function activate(context: Vscode.ExtensionContext) {
    Output.instance = new Output();

    const commander = new Commander(context);
    const initializer = new Initializer(context);
    commander.register('initializeWorkspace', () => initializer.initializeWorkspace());
}

export function deactivate() {}
