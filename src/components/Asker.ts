import * as Vscode from 'vscode';
import Storage from './Storage';

export default class Asker {
    private readonly storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    private validateWsUrl(url: string) {
        if (
            !/^ws:\/\/(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/.test(
                url
            )
        ) {
            throw new Error('WS服务器URL格式不正确');
        }
    }

    async askForWsUrl(): Promise<string> {
        const url = (await Vscode.window.showInputBox({ prompt: '请输入WS服务器URL', value: 'ws://192.168.', placeHolder: 'ws://192.168.' })) ?? '';
        this.validateWsUrl(url);
        return url;
    }

    async askForWsUrlWithHistory(): Promise<string> {
        const wsUrls = this.storage.getWsUrls();
        if (wsUrls.length === 0) {
            return this.askForWsUrl();
        }
        const defaultSelections = ['连接新设备', '清空历史设备'];
        const selections = wsUrls.concat(defaultSelections);
        const selection = (await Vscode.window.showQuickPick(selections, { placeHolder: '请输入WS服务器URL' })) ?? '';
        if (selection === '连接新设备') {
            return this.askForWsUrl();
        }
        if (selection === '清空历史设备') {
            this.storage.setWsUrls();
            return this.askForWsUrl();
        }
        this.validateWsUrl(selection);
        return selection;
    }
}
