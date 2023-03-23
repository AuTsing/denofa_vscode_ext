import * as Vscode from 'vscode';
import Commander from './components/Commander';
import Initializer from './components/Initializer';
import LanguageServer from './components/LanguageServer';

export function activate(context: Vscode.ExtensionContext) {
    const commander = new Commander(context);
    const initializer = new Initializer();
    commander.register('initializeWorkspace', initializer.initializeWorkspace);

    const languageServer = new LanguageServer(context);
}

export function deactivate() {}
