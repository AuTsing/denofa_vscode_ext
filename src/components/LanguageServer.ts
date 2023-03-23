import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as Parser from '@babel/parser';
import * as Path from 'path';

class DenortCompletionItemProvider implements Vscode.CompletionItemProvider {
    provideCompletionItems(
        document: Vscode.TextDocument,
        position: Vscode.Position,
        token: Vscode.CancellationToken,
        context: Vscode.CompletionContext
    ): Vscode.ProviderResult<Vscode.CompletionItem[] | Vscode.CompletionList<Vscode.CompletionItem>> {
        const items = [];
        const i = new Vscode.CompletionItem('');

        return undefined;
    }
}

export default class LanguageServer {
    private context: Vscode.ExtensionContext;
    private documentSelector: Vscode.DocumentSelector;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
        this.documentSelector = [
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'javascript' },
        ];

        const root = this.context.extensionPath;
        const dts = Path.join(root, 'assets', 'dts', 'Android.d.ts');
        const source = Fs.readFileSync(dts, 'utf-8');
        const ast = Parser.parse(source, {
            allowImportExportEverywhere: true,
            plugins: [['typescript', { dts: true }]],
        });

        console.log(ast);
    }

    enableCompletionItem() {
        this.context.subscriptions.push(Vscode.languages.registerCompletionItemProvider(this.documentSelector, new DenortCompletionItemProvider(), '.'));
    }
}
