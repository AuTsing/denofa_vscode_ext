import * as Vscode from 'vscode';

export default class Asker {
    async askForWsUrl(): Promise<string> {
        const url = (await Vscode.window.showInputBox({ prompt: '请输入WS服务器URL', value: 'ws://192.168.', placeHolder: 'ws://192.168.' })) ?? '';
        if (
            !/^ws:\/\/(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/.test(
                url
            )
        ) {
            throw new Error('WS服务器URL格式不正确');
        }
        return url;
    }
}
