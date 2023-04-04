import * as Vscode from 'vscode';
import Initializer from './components/Initializer';
import Output from './components/Output';
import Wsd from './components/Wsd';
import Asker from './components/Asker';
import Registry from './components/Registry';
import Commander from './components/Commander';
import Workspace from './components/Workspace';

export function activate(context: Vscode.ExtensionContext) {
    Output.instance = new Output();

    const registry = new Registry(context);
    const workspace = new Workspace();
    const initializer = new Initializer(context, workspace);
    registry.register('initializeWorkspace', () => initializer.initializeWorkspace());

    const asker = new Asker();
    const commander = new Commander();
    const wsd = new Wsd(asker, commander, workspace);
    registry.register('connect', () => wsd.handleConnect());
    registry.register('disconnect', () => wsd.handleDisconnect());
    registry.register('run', () => wsd.handleRun());
    registry.register('stop', () => wsd.handleStop());
    registry.register('upload', () => wsd.handleUpload());
}

export function deactivate() {}
