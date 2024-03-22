import * as Vscode from 'vscode';
import Initializer from './components/Initializer';
import Output from './components/Output';
import Wsd from './components/Wsd';
import Asker from './components/Asker';
import Registry from './components/Registry';
import Commander from './components/Commander';
import Workspace from './components/Workspace';
import StatusBar from './components/StatusBar';
import Storage from './components/Storage';

export function activate(context: Vscode.ExtensionContext) {
    const workspace = new Workspace();
    const registry = new Registry(context);
    const storage = new Storage(context);
    const asker = new Asker(storage);
    const initializer = new Initializer(context, workspace, asker, storage);
    const commander = new Commander();
    const wsd = new Wsd(asker, commander, workspace, storage);

    Output.instance = new Output();
    StatusBar.instance = new StatusBar(workspace);

    registry.register('initializeWorkspace', () => initializer.initializeWorkspace());
    registry.register('updateDts', () => initializer.updateDts());
    registry.register('connect', () => wsd.handleConnect());
    registry.register('disconnect', () => wsd.handleDisconnect());
    registry.register('run', () => wsd.handleRun());
    registry.register('stop', () => wsd.handleStop());
    registry.register('upload', () => wsd.handleUpload());
    registry.register('snapshot', () => wsd.handleSnapshot());
    registry.register('clickStatusBarItem', () => StatusBar.instance?.handleClickStatusBarItem());
    registry.listenOnDidChangeConfiguration(() => initializer.initializeExtension());

    initializer.initializeExtension();
}

export function deactivate() {}
