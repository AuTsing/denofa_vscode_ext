import * as Vscode from 'vscode';
import * as FsPromises from 'fs/promises';
import * as Path from 'path';
import { DENO_EXTENSION_ID, DENO_NS } from '../values/Constants';

export interface WorkspaceFile {
    name: string;
    absolutePath: string;
    relativePath: string;
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

    private async readdirRecursively(absolutePath: string, relativePath: string = '', files: WorkspaceFile[] = []): Promise<WorkspaceFile[]> {
        const dirents = await FsPromises.readdir(absolutePath, { withFileTypes: true });
        for (const dirent of dirents) {
            if (dirent.isFile()) {
                const file: WorkspaceFile = {
                    name: dirent.name,
                    absolutePath: Path.join(absolutePath, dirent.name).replace(/\\/g, '/'),
                    relativePath: Path.join(relativePath, dirent.name).replace(/\\/g, '/'),
                };
                files.push(file);
                continue;
            }
            if (dirent.isDirectory()) {
                await this.readdirRecursively(Path.join(absolutePath, dirent.name), Path.join(relativePath, dirent.name), files);
                continue;
            }
        }
        return files;
    }

    async getWrokspaceFiles(): Promise<WorkspaceFile[]> {
        const workspaceFolder = this.getWorkspaceFolder();
        const files = await this.readdirRecursively(workspaceFolder.uri.fsPath, 'Projects/' + workspaceFolder.name);
        return files;
    }

    getDenoConfiguration(): Vscode.WorkspaceConfiguration {
        const denoExtension = Vscode.extensions.getExtension(DENO_EXTENSION_ID);
        if (!denoExtension) {
            throw new Error('没有检测到 Deno 插件，请先安装官方 Deno 插件');
        }
        return Vscode.workspace.getConfiguration(DENO_NS);
    }
}
