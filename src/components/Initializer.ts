import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as Path from 'path';
import * as Jsonfile from 'jsonfile';
import { DENO_NS, DENO_EXTENSION_ID, DENO_CMD_RESTART } from '../values/Constants';
import Output from './Output';
import Workspace from './Workspace';

export default class Initializer {
    private readonly context: Vscode.ExtensionContext;
    private readonly workspace: Workspace;

    constructor(context: Vscode.ExtensionContext, workspace: Workspace) {
        this.context = context;
        this.workspace = workspace;
    }

    async initializeWorkspace() {
        try {
            const denoExtension = Vscode.extensions.getExtension(DENO_EXTENSION_ID);
            if (!denoExtension) {
                throw new Error('没有检测到 Deno 插件，请先安装官方 Deno 插件');
            }
            const denoConfig = Vscode.workspace.getConfiguration(DENO_NS);
            await denoConfig.update('enable', true);
            await denoConfig.update('unstable', true);

            const workspaceFolder = this.workspace.getWorkspaceFolder();
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

            const mainTs = Path.join(workspaceFolder.uri.fsPath, 'main.ts');
            const mainJs = Path.join(workspaceFolder.uri.fsPath, 'main.js');
            if (!Fs.existsSync(mainTs) && !Fs.existsSync(mainJs)) {
                const mainTsTemplate = Path.join(root, 'assets', 'templates', 'main.ts');
                const mainTsContent = Fs.readFileSync(mainTsTemplate);
                Fs.writeFileSync(mainTs, mainTsContent);
            }

            await Vscode.commands.executeCommand(DENO_CMD_RESTART);

            Output.printlnAndShow('Denort 工作区初始化成功');
        } catch (err) {
            Output.eprintln('Denort 工作区初始化失败:', err);
        }
    }
}
