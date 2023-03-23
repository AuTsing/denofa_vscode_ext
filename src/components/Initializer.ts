import * as Vscode from 'vscode';
import { EXTENSION_NS } from '../values/Constants';

export default class Initializer {
    async initializeWorkspace() {
        try {
            const config = Vscode.workspace.getConfiguration(EXTENSION_NS);
            await config.update('enable', true);
            await Vscode.window.showInformationMessage('Denort 工作区初始化成功');
        } catch {
            await Vscode.window.showErrorMessage('Denort 工作区初始化失败');
        }
    }
}
