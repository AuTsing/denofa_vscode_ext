import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import * as Jsonfile from 'jsonfile';
import { DENO_NS } from '../values/Constants';

export default class Initializer {
    private readonly context: Vscode.ExtensionContext;

    constructor(context: Vscode.ExtensionContext) {
        this.context = context;
    }

    async initializeWorkspace() {
        try {
            const denoExtension = Vscode.extensions.getExtension('denoland.vscode-deno');
            if (!denoExtension) {
                throw new Error('没有检测到 Deno 插件，请先安装官方 Deno 插件');
            }
            const denoConfig = Vscode.workspace.getConfiguration(DENO_NS);
            await denoConfig.update('enable', true);
            await denoConfig.update('unstable', true);

            const workspaceFolders = Vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('未打开工程');
            }
            if (workspaceFolders.length > 1) {
                throw new Error('暂不支持多工程工作区');
            }

            const workspaceFolder = workspaceFolders[0];
            const denoJson = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
            let denoJsonObject: { compilerOptions: { types: string[] } };
            if (Fs.existsSync(denoJson) && Fs.readFileSync(denoJson, { encoding: 'utf-8' }) !== '') {
                denoJsonObject = Jsonfile.readFileSync(denoJson);
                denoJsonObject.compilerOptions = denoJsonObject.compilerOptions ?? {};
                denoJsonObject.compilerOptions.types = denoJsonObject.compilerOptions.types ?? [];
            } else {
                denoJsonObject = { compilerOptions: { types: [] } };
            }
            const root = this.context.extensionPath;
            const dts = Path.join(root, 'assets', 'dts', 'Android.d.ts');
            const dtsUri = Vscode.Uri.file(dts);
            if (!denoJsonObject.compilerOptions.types.includes(dtsUri.toString())) {
                denoJsonObject.compilerOptions.types.push(dtsUri.toString());
            }
            Jsonfile.writeFileSync(denoJson, denoJsonObject, { spaces: 4 });

            await Vscode.window.showInformationMessage('Denort 工作区初始化成功');
        } catch (err) {
            console.log(err);
            if (err instanceof Error) {
                await Vscode.window.showErrorMessage('Denort 工作区初始化失败');
            }
        }
    }
}
