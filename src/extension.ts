import * as Vscode from 'vscode';
import Commander from './components/Commander';
import Initializer from './components/Initializer';

export function activate(context: Vscode.ExtensionContext) {
    const commander = new Commander(context);
    const initializer = new Initializer(context);
    commander.register('initializeWorkspace', () => initializer.initializeWorkspace());
}

export function deactivate() {}
