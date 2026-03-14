import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import { DiagnosticsManager } from "../diagnostics/diagnosticsManager";
import { buildGraph, GraphBuildResult } from "../graph/graphBuilder";
import { ParsedFile, RevealableKind } from "../models/types";
import { parseLinkFile } from "../parser/parser";
import { EntityTreeProvider } from "../tree/entityTreeProvider";
import { GraphPanel } from "../webview/graphPanel";

export class WorkspaceService implements vscode.Disposable {
  private latestResult: GraphBuildResult = buildGraph([]);
  private refreshTimer: NodeJS.Timeout | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly diagnosticsManager: DiagnosticsManager,
    private readonly treeProvider: EntityTreeProvider,
    private readonly graphPanel: GraphPanel
  ) {}

  async initialize(): Promise<void> {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => this.onDocumentEvent(document)),
      vscode.workspace.onDidSaveTextDocument((document) => this.onDocumentEvent(document)),
      vscode.workspace.onDidChangeTextDocument((event) => this.onDocumentEvent(event.document)),
      vscode.workspace.onDidCreateFiles(() => this.scheduleRefresh()),
      vscode.workspace.onDidDeleteFiles(() => this.scheduleRefresh()),
      vscode.workspace.onDidRenameFiles(() => this.scheduleRefresh())
    );

    await this.refresh();
  }

  dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }

  getGraphResult(): GraphBuildResult {
    return this.latestResult;
  }

  async refresh(): Promise<GraphBuildResult> {
    const parsedFiles = await this.loadParsedFiles();
    this.latestResult = buildGraph(parsedFiles);
    this.diagnosticsManager.publish(this.latestResult.issuesByFile);
    this.treeProvider.setGraph(this.latestResult.graph);
    this.graphPanel.update(this.latestResult.graph);
    return this.latestResult;
  }

  async exportGraph(): Promise<vscode.Uri | undefined> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return undefined;
    }

    const exportDir = path.join(workspaceFolder.uri.fsPath, ".link-analysis");
    const exportPath = path.join(exportDir, "graph.json");
    await fs.mkdir(exportDir, { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(this.latestResult.graph, null, 2), "utf8");
    return vscode.Uri.file(exportPath);
  }

  async reveal(kind: RevealableKind, id: string): Promise<void> {
    const location = this.latestResult.locationByKey.get(`${kind}:${id}`);
    if (!location) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(location.filePath));
    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    const position = new vscode.Position(Math.max(location.line - 1, 0), 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    this.graphPanel.focusElement(kind, id);
  }

  private onDocumentEvent(document: vscode.TextDocument): void {
    if (document.uri.scheme !== "file" || !document.fileName.endsWith(".link.md")) {
      return;
    }

    this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      void this.refresh();
    }, 150);
  }

  private async loadParsedFiles(): Promise<ParsedFile[]> {
    const files = await vscode.workspace.findFiles("**/*.link.md");
    const parsedFiles = await Promise.all(
      files.map(async (uri) => {
        const content = await fs.readFile(uri.fsPath, "utf8");
        return parseLinkFile(uri.fsPath, content);
      })
    );

    return parsedFiles;
  }
}
