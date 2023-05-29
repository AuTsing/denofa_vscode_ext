import * as Vscode from 'vscode';
import { DENORT_NS } from '../values/Constants';

export enum Configurations {
    UpdateDts = 'updateDts',
}

export default class Storage {
    private readonly state: Vscode.Memento;
    private readonly configuration: Vscode.WorkspaceConfiguration;

    constructor(context: Vscode.ExtensionContext) {
        this.state = context.globalState;
        this.configuration = Vscode.workspace.getConfiguration(DENORT_NS);
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

    getUpdateDts(): boolean {
        return this.configuration.get<boolean>(Configurations.UpdateDts) ?? true;
    }

    setUpdateDts(value: boolean) {
        this.configuration.update(Configurations.UpdateDts, value);
    }
}
