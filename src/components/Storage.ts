import * as Vscode from 'vscode';

export default class Storage {
    private readonly state: Vscode.Memento;

    constructor(context: Vscode.ExtensionContext) {
        this.state = context.globalState;
    }

    getWsUrls(): string[] {
        return this.state.get('wsUrls', []);
    }

    setWsUrls(wsUrls: string[] = []) {
        this.state.update('wsUrls', wsUrls);
    }

    addWsUrl(wsUrl: string) {
        const wsUrls = this.getWsUrls();
        const index = wsUrls.indexOf(wsUrl);
        if (index > -1) {
            wsUrls.splice(index, 1);
        }
        wsUrls.push(wsUrl);
        this.setWsUrls(wsUrls);
    }
}
