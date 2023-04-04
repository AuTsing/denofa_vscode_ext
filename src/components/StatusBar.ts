import * as Vscode from 'vscode';
import Workspace from './Workspace';
import Output from './Output';

export class StatusItem {
    prefix: string;
    content: string;
    surfix: string;
    private readonly statusItems: StatusItem[];

    constructor(content: string, statusItems: StatusItem[], prefix: string = '', surfix: string = '') {
        this.content = content;
        this.statusItems = statusItems;
        this.prefix = prefix;
        this.surfix = surfix;
    }

    public display(): string {
        return `${this.prefix} ${this.content} ${this.surfix}`;
    }

    public dispose() {
        this.statusItems.splice(this.statusItems.indexOf(this), 1);
    }

    public updateProgress(percent: number) {
        this.prefix = `${Math.round(percent * 100)}%`;
    }
}

export default class StatusBar {
    static instance?: StatusBar;

    static connected(label: string) {
        if (!StatusBar.instance) {
            return;
        }
        const statusItem = new StatusItem(label, StatusBar.instance.statusItems, '🦕', '已连接');
        StatusBar.instance.statusItems.push(statusItem);
    }

    static disconnected(label: string) {
        if (!StatusBar.instance) {
            return;
        }
        const maybeStatusItem = StatusBar.instance.statusItems.find(it => it.content === label);
        maybeStatusItem?.dispose();
    }

    static doing(task: string): StatusItem | undefined {
        if (!StatusBar.instance) {
            return;
        }
        const statusItem = new StatusItem(task, StatusBar.instance.statusItems, '$(loading~spin)', '...');
        StatusBar.instance.statusItems.push(statusItem);
        return statusItem;
    }

    static running(runningProjects: string[]) {
        if (!StatusBar.instance) {
            return;
        }
        if (!StatusBar.instance.runningStatusItem) {
            return;
        }
        if (runningProjects.length === 0) {
            StatusBar.instance.runningStatusItem.dispose();
            return;
        }
        if (runningProjects.length === 1) {
            StatusBar.instance.runningStatusItem.content = runningProjects[0];
        }
        if (runningProjects.length > 1) {
            StatusBar.instance.runningStatusItem.content = `${runningProjects.length} 个工程`;
        }
        if (!StatusBar.instance.statusItems.includes(StatusBar.instance.runningStatusItem)) {
            StatusBar.instance.statusItems.push(StatusBar.instance.runningStatusItem);
        }
    }

    private readonly workspace: Workspace;
    private readonly statusBarItem: Vscode.StatusBarItem;
    private readonly statusItems: StatusItem[];
    private refresher: NodeJS.Timer | null;
    private runningStatusItem: StatusItem | null;

    constructor(workspace: Workspace) {
        this.workspace = workspace;
        this.statusBarItem = Vscode.window.createStatusBarItem(Vscode.StatusBarAlignment.Left);
        this.statusItems = [];
        this.refresher = null;
        this.runningStatusItem = new StatusItem('', this.statusItems, '$(loading~spin)', '运行中');
        const defaultStatusItem = new StatusItem('Denort', this.statusItems, '🦕');
        this.statusItems.push(defaultStatusItem);
        this.statusBarItem.text = defaultStatusItem.display();
        this.toggleStatusBar();
    }

    private refresh() {
        const statusItem = this.statusItems[this.statusItems.length - 1];
        this.statusBarItem.text = statusItem.display();
    }

    toggleStatusBar() {
        try {
            const denoConfig = this.workspace.getDenoConfiguration();
            if (denoConfig.get('enable') === true && this.refresher === null) {
                this.statusBarItem.show();
                this.refresher = setInterval(() => this.refresh(), 1000);
            } else if (denoConfig.get('enable') !== true && this.refresher !== null) {
                this.statusBarItem.hide();
                clearInterval(this.refresher);
                this.refresher = null;
            }
        } catch (e) {
            Output.eprintln('启用状态栏失败:', e);
        }
    }
}
