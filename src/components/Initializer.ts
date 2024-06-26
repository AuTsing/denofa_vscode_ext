import * as Vscode from 'vscode';
import * as Fs from 'fs';
import * as FsPromises from 'fs/promises';
import * as Path from 'path';
import * as Jsonfile from 'jsonfile';
import Axios from 'axios';
import Output from './Output';
import Workspace from './Workspace';
import { DTS_URL, DENO_CMD_CACHE, DENO_CMD_RESTART } from '../values/Constants';
import Asker from './Asker';
import Storage from './Storage';
import StatusBar from './StatusBar';

export default class Initializer {
    private readonly context: Vscode.ExtensionContext;
    private readonly workspace: Workspace;
    private readonly asker: Asker;
    private readonly storage: Storage;
    private triedUpdateDtsTimes: number;

    constructor(
        context: Vscode.ExtensionContext,
        workspace: Workspace,
        asker: Asker,
        storage: Storage,
    ) {
        this.context = context;
        this.workspace = workspace;
        this.asker = asker;
        this.storage = storage;
        this.triedUpdateDtsTimes = 0;
    }

    private async getLatestVersion(): Promise<string> {
        const axios = Axios.create({ maxRedirects: 0, timeout: 3000 });
        axios.interceptors.response.use(
            resp => resp,
            err => {
                if (err.response?.status === 302) {
                    return Promise.resolve(err.response);
                } else {
                    return Promise.reject(err);
                }
            },
        );
        const resp = await axios.get(DTS_URL);
        const location = resp.headers.location as string;
        if (!location) {
            throw new Error('查询类型定义文件版本失败');
        }

        const ver = location.match(/@(v.+)\//)?.[1];
        if (!ver) {
            throw new Error('查询类型定义文件版本失败');
        }

        return ver;
    }

    private async getLatestUrl(ver?: string): Promise<string> {
        const version = ver ?? (await this.getLatestVersion());
        const url = DTS_URL.replace('denofa_types', `denofa_types@${version}`);
        return url;
    }

    async initializeWorkspace() {
        try {
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const denoJsonPath = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
            const denoJson = await this.workspace.getDenoJson();
            const latestUrl = await this.getLatestUrl();
            const types = denoJson?.compilerOptions?.types ?? [];
            const filtedTypes = types.filter(it => !it.includes('denofa_types'));
            filtedTypes.push(latestUrl);
            denoJson.compilerOptions = denoJson.compilerOptions ?? {};
            denoJson.compilerOptions.types = filtedTypes;
            Jsonfile.writeFileSync(denoJsonPath, denoJson, { spaces: 4 });

            const root = this.context.extensionPath;
            const mainTs = Path.join(workspaceFolder.uri.fsPath, 'main.ts');
            const mainJs = Path.join(workspaceFolder.uri.fsPath, 'main.js');
            if (!Fs.existsSync(mainTs) && !Fs.existsSync(mainJs)) {
                const mainTsTemplate = Path.join(root, 'assets', 'templates', 'main.ts');
                const mainTsContent = await FsPromises.readFile(mainTsTemplate);
                await FsPromises.writeFile(mainTs, mainTsContent);
            } else {
                Output.println('main.ts/main.js 已存在，跳过创建');
            }

            const denofaConfig = this.workspace.getDenofaConfiguration();
            if (denofaConfig.get('enable') !== true) {
                await denofaConfig.update('enable', true);
                await new Promise(resolve => setTimeout(() => resolve(null), 1000));
            } else {
                Output.println('Denofa 插件已开启，跳过开启');
            }
            const denoConfig = this.workspace.getDenoConfiguration();
            if (denoConfig.get('enable') !== true) {
                await denoConfig.update('enable', true);
                await new Promise(resolve => setTimeout(() => resolve(null), 1000));
            } else {
                Output.println('Deno 插件已开启，跳过开启');
            }

            Output.printlnAndShow('Denofa 工作区初始化成功');
        } catch (err) {
            Output.eprintln('Denofa 工作区初始化失败:', err);
        }
    }

    async initializeExtension() {
        StatusBar.instance?.toggleStatusBar();
        await this.updateDts();
    }

    async updateDts() {
        try {
            this.triedUpdateDtsTimes++;

            const denofaConfig = this.workspace.getDenofaConfiguration();
            if (denofaConfig.get('enable') !== true) {
                return;
            }

            const updateDts = this.storage.getUpdateDts();
            if (!updateDts) {
                return;
            }

            const denoJson = await this.workspace.getDenoJson();
            const types = denoJson?.compilerOptions?.types ?? [];

            const latestVersion = await this.getLatestVersion();
            const latestUrl = await this.getLatestUrl(latestVersion);
            if (types.includes(latestUrl)) {
                return;
            }

            const update = await this.asker.askForIsUpdateDts(latestVersion);
            if (!update) {
                return;
            }

            const filtedTypes = types.filter(it => !it.includes('denofa_types'));
            filtedTypes.push(latestUrl);
            denoJson.compilerOptions = denoJson.compilerOptions ?? {};
            denoJson.compilerOptions.types = filtedTypes;
            const workspaceFolder = this.workspace.getWorkspaceFolder();
            const denoJsonPath = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
            await Jsonfile.writeFile(denoJsonPath, denoJson, { spaces: 4 });

            await new Promise(resolve => setTimeout(() => resolve(null), 1000));
            await Vscode.commands.executeCommand(DENO_CMD_CACHE);
            await new Promise(resolve => setTimeout(() => resolve(null), 1000));
            await Vscode.commands.executeCommand(DENO_CMD_RESTART);

            this.triedUpdateDtsTimes = 0;
            Output.printlnAndShow('更新类型定义文件成功');
        } catch (err) {
            Output.eprintln('更新类型定义文件失败:', err);

            if (this.triedUpdateDtsTimes < 5) {
                Output.eprintln('尝试重新执行更新类型定义文件');
                this.updateDts();
            }
        }
    }
}
