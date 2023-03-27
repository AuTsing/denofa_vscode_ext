import * as Vscode from 'vscode';
import Commander from './components/Commander';
import Initializer from './components/Initializer';
import LanguageServer from './components/LanguageServer';

export function activate(context: Vscode.ExtensionContext) {
    const commander = new Commander(context);
    const initializer = new Initializer();
    commander.register('initializeWorkspace', initializer.initializeWorkspace);

    const languageServer = new LanguageServer(context);
    // languageServer.enableCompletionItem();
    languageServer.enableDefinition();
    // languageServer.enableDocumentSymbol();
}

export function deactivate() {}
