import * as Vscode from 'vscode';
import * as FsPromises from 'fs/promises';
import * as Fs from 'fs';
import * as Path from 'path';
import { DENOFA_EXTENSION_ID, DENOFA_NS, DENO_EXTENSION_ID, DENO_NS } from '../values/Constants';

export interface WorkspaceFile {
    name: string;
    absolutePath: string;
    remotePath: string;
}

export interface DenoJson {
    imports?: {};
    compilerOptions?: {
        types?: string[];
    };
}

export default class Workspace {
    getWorkspaceFolder(): Vscode.WorkspaceFolder {
        const workspaceFolders = Vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('未打开工程');
        }
        if (workspaceFolders.length > 1) {
            throw new Error('暂不支持多工程工作区');
        }
        return workspaceFolders[0];
    }

    private async readdirRecursively(
        absolutePath: string,
        relativePath: string = '',
        files: WorkspaceFile[] = [],
    ): Promise<WorkspaceFile[]> {
        const dirents = await FsPromises.readdir(absolutePath, { withFileTypes: true });
        for (const dirent of dirents) {
            if (dirent.name.startsWith('.')) {
                continue;
            }
            if (dirent.isFile()) {
                const file: WorkspaceFile = {
                    name: dirent.name,
                    absolutePath: Path.join(absolutePath, dirent.name).replace(/\\/g, '/'),
                    remotePath: Path.join(relativePath, dirent.name).replace(/\\/g, '/'),
                };
                files.push(file);
                continue;
            }
            if (dirent.isDirectory()) {
                await this.readdirRecursively(
                    Path.join(absolutePath, dirent.name),
                    Path.join(relativePath, dirent.name),
                    files,
                );
                continue;
            }
        }
        return files;
    }

    async getWrokspaceFiles(): Promise<WorkspaceFile[]> {
        const workspaceFiles = [] as WorkspaceFile[];
        const workspaceFolder = this.getWorkspaceFolder();

        const denoJson = await this.getDenoJson();
        const imports = Object.values(denoJson.imports ?? {});
        const localImports = imports.filter(
            it => typeof it === 'string' && it.startsWith('.'),
        ) as string[];
        const localImportsAbsolutePaths = localImports.map(it =>
            Path.resolve(workspaceFolder.uri.fsPath, it),
        );
        for (const path of localImportsAbsolutePaths) {
            const name = Path.basename(path);
            const files = await this.readdirRecursively(path, 'Projects/' + name);
            workspaceFiles.push(...files);
        }

        const files = await this.readdirRecursively(
            workspaceFolder.uri.fsPath,
            'Projects/' + workspaceFolder.name,
        );
        workspaceFiles.push(...files);

        return workspaceFiles;
    }

    getDenoConfiguration(): Vscode.WorkspaceConfiguration {
        const denoExtension = Vscode.extensions.getExtension(DENO_EXTENSION_ID);
        if (!denoExtension) {
            throw new Error('未检测到 Deno 官方插件，请先安装插件后再进行操作');
        }
        return Vscode.workspace.getConfiguration(DENO_NS);
    }

    getDenofaConfiguration(): Vscode.WorkspaceConfiguration {
        const denofaExtension = Vscode.extensions.getExtension(DENOFA_EXTENSION_ID);
        if (!denofaExtension) {
            throw new Error('未检测到 Denofa 插件，请先安装插件后再进行操作');
        }
        return Vscode.workspace.getConfiguration(DENOFA_NS);
    }

    async getDenoJson(): Promise<DenoJson> {
        const workspaceFolder = this.getWorkspaceFolder();
        const denoJsonPath = Path.join(workspaceFolder.uri.fsPath, 'deno.json');
        if (!Fs.existsSync(denoJsonPath)) {
            return {};
        }
        const denoJsonContent = await FsPromises.readFile(denoJsonPath, { encoding: 'utf-8' });
        const denoJson = JSON.parse(denoJsonContent);
        return denoJson;
    }
}
