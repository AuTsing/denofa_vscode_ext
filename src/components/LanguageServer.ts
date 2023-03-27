import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import Parser from './Parser';
import Traverse from '@babel/traverse';
import * as BabelTypes from '@babel/types';

class DenortCompletionItemProvider implements Vscode.CompletionItemProvider {
    provideCompletionItems(
        document: Vscode.TextDocument,
        position: Vscode.Position,
        token: Vscode.CancellationToken,
        context: Vscode.CompletionContext
    ): Vscode.ProviderResult<Vscode.CompletionItem[] | Vscode.CompletionList<Vscode.CompletionItem>> {
        const items = [];
        const item = new Vscode.CompletionItem('Android', Vscode.CompletionItemKind.Module);
        items.push(item);

        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        console.log(linePrefix);

        return items;
    }
}

class DenortDefinitionProvider implements Vscode.DefinitionProvider {
    private parser: Parser;
    private dts: Vscode.Uri;

    constructor(parser: Parser, dts: Vscode.Uri) {
        this.parser = parser;
        this.dts = dts;
    }

    provideDefinition(
        document: Vscode.TextDocument,
        position: Vscode.Position,
        token: Vscode.CancellationToken
    ): Vscode.ProviderResult<Vscode.Definition | Vscode.LocationLink[]> {
        const definitions: Vscode.Definition = [];

        const nodes = this.parser.parse(document.getText()).filter('Identifier');

        const pointingNode = nodes.find(node => {
            const offset = document.offsetAt(position);
            if (node.start && offset >= node.start && node.end && offset <= node.end) {
                return true;
            } else {
                return false;
            }
        });

        if (!pointingNode) {
            return undefined;
        }

        const definition = new Vscode.Location(this.dts, new Vscode.Position(0, 0));
        definitions.push(definition);

        return definitions;
    }
}

class DenortDocumentSymbolProvider implements Vscode.DocumentSymbolProvider {
    provideDocumentSymbols(
        document: Vscode.TextDocument,
        token: Vscode.CancellationToken
    ): Vscode.ProviderResult<Vscode.SymbolInformation[] | Vscode.DocumentSymbol[]> {
        const items = [];

        let name = 'Android';
        let start = document.getText().indexOf(name);
        if (start > -1) {
            let range = new Vscode.Range(document.positionAt(start), document.positionAt(start + 7));
            items.push(new Vscode.DocumentSymbol('Android', 'Android detail', Vscode.SymbolKind.Module, range, range));
        }

        return items;
    }
}

export default class LanguageServer {
    private context: Vscode.ExtensionContext;
    private documentSelector: Vscode.DocumentSelector;
    private parser: Parser;
    private dts: Vscode.Uri;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
        this.documentSelector = [
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'javascript' },
        ];
        this.parser = new Parser();

        const root = this.context.extensionPath;
        const dts = Path.join(root, 'assets', 'dts', 'Android.d.ts');
        this.dts = Vscode.Uri.file(dts);

        const source = Fs.readFileSync(dts, 'utf-8');
        const ast = this.parser.parseAndGet(source, {
            plugins: [['typescript', { dts: true }]],
        });

        console.log(ast);
    }

    enableCompletionItem() {
        this.context.subscriptions.push(Vscode.languages.registerCompletionItemProvider(this.documentSelector, new DenortCompletionItemProvider()));
    }

    enableDefinition() {
        this.context.subscriptions.push(
            Vscode.languages.registerDefinitionProvider(this.documentSelector, new DenortDefinitionProvider(this.parser, this.dts))
        );
    }

    enableDocumentSymbol() {
        this.context.subscriptions.push(Vscode.languages.registerDocumentSymbolProvider(this.documentSelector, new DenortDocumentSymbolProvider()));
    }
}
