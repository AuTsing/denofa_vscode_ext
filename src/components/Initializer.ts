import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as FsPromises from 'fs/promises';
import * as Path from 'path';
import * as Jsonfile from 'jsonfile';
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
            const denoConfig = this.workspace.getDenoConfiguration();
            await denoConfig.update('enable', true);
            await denoConfig.update('unstable', true);

            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const denoJson = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
            let denoJsonObject: { compilerOptions: { types: string[] } };
            if (Fs.existsSync(denoJson) && (await FsPromises.readFile(denoJson, { encoding: 'utf-8' })) !== '') {
                denoJsonObject = await Jsonfile.readFile(denoJson);
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
                const mainTsContent = await FsPromises.readFile(mainTsTemplate);
                await FsPromises.writeFile(mainTs, mainTsContent);
            }

            Output.printlnAndShow('Denort 工作区初始化成功');
        } catch (err) {
            Output.eprintln('Denort 工作区初始化失败:', err);
        }
    }

    async initializeDenoJson() {
        try {
            const denoConfig = this.workspace.getDenoConfiguration();
            if (denoConfig.get('enable') !== true) {
                return;
            }

            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const denoJson = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
            let denoJsonObject: { compilerOptions: { types: string[] } };
            if (Fs.existsSync(denoJson) && (await FsPromises.readFile(denoJson, { encoding: 'utf-8' })) !== '') {
                denoJsonObject = Jsonfile.readFileSync(denoJson);
                denoJsonObject.compilerOptions = denoJsonObject.compilerOptions ?? {};
                denoJsonObject.compilerOptions.types = denoJsonObject.compilerOptions.types ?? [];
            } else {
                denoJsonObject = { compilerOptions: { types: [] } };
            }
            const root = this.context.extensionPath;
            const dts = Path.join(root, 'assets', 'dts', 'Android.d.ts');
            const dtsUri = Vscode.Uri.file(dts);
            denoJsonObject.compilerOptions.types = denoJsonObject.compilerOptions.types.filter(type => {
                return type.indexOf('Android.d.ts') < 0 && type === dtsUri.toString();
            });
            if (!denoJsonObject.compilerOptions.types.includes(dtsUri.toString())) {
                denoJsonObject.compilerOptions.types.push(dtsUri.toString());
            }
            await Jsonfile.writeFile(denoJson, denoJsonObject, { spaces: 4 });
        } catch (err) {
            Output.eprintln('初始化 Deno 配置文件失败:', err);
        }
    }
}
