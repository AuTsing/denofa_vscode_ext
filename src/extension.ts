import * as Vscode from 'vscode';
import Commander from './components/Commander';
import Initializer from './components/Initializer';
import Output from './components/Output';
import Wsd from './components/Wsd';
import Asker from './components/Asker';

export function activate(context: Vscode.ExtensionContext) {
    Output.instance = new Output();

    const commander = new Commander(context);
    const initializer = new Initializer(context);
    commander.register('initializeWorkspace', () => initializer.initializeWorkspace());

    const asker = new Asker();
    const wsd = new Wsd(asker);
    commander.register('connect', () => wsd.handleConnect());
    commander.register('disconnect', () => wsd.handleDisconnect());
}

export function deactivate() {}
