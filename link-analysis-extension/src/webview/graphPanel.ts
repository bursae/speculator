import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { GraphModel } from "../models/types";

export type GraphSelectionMessage =
  | { type: "node:selected"; payload: { id: string } }
  | { type: "edge:selected"; payload: { id: string } };

export class GraphPanel {
  private panel: vscode.WebviewPanel | undefined;
  private onSelection?: (message: GraphSelectionMessage) => void;
  private latestGraph: GraphModel = { entities: [], relationships: [], events: [] };

  constructor(private readonly extensionUri: vscode.Uri) {}

  onDidReceiveSelection(callback: (message: GraphSelectionMessage) => void): void {
    this.onSelection = callback;
  }

  reveal(graph?: GraphModel): void {
    if (graph) {
      this.latestGraph = graph;
    }

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "linkAnalysis.graph",
        "Link Analysis Graph",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "webview", "dist")]
        }
      );

      this.panel.webview.html = this.getHtml(this.panel.webview);
      this.panel.webview.onDidReceiveMessage((message: GraphSelectionMessage) => {
        this.onSelection?.(message);
      });
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    } else {
      this.panel.reveal(vscode.ViewColumn.Beside);
    }

    this.postCurrentGraph();
  }

  update(graph: GraphModel): void {
    this.latestGraph = graph;
    this.postCurrentGraph();
  }

  private postCurrentGraph(): void {
    this.postMessage({
      type: "graph:update",
      payload: this.latestGraph
    });
  }

  focusElement(kind: "entity" | "relationship" | "event", id: string): void {
    this.postMessage({
      type: "graph:focus",
      payload: { kind, id }
    });
  }

  private postMessage(message: unknown): void {
    void this.panel?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const distPath = path.join(this.extensionUri.fsPath, "webview", "dist");
    const scriptFile = "webview.js";
    const cssFile = "webview.css";
    if (!fs.existsSync(path.join(distPath, scriptFile))) {
      return `<!DOCTYPE html><html><body><p>Webview assets not built. Run <code>npm run build:webview</code>.</p></body></html>`;
    }

    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(distPath, scriptFile)));
    const cssUri = fs.existsSync(path.join(distPath, cssFile))
      ? webview.asWebviewUri(vscode.Uri.file(path.join(distPath, cssFile))).toString()
      : "";
    const nonce = String(Date.now());

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${cssUri ? `<link rel="stylesheet" href="${cssUri}" />` : ""}
    <title>Link Analysis</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}">
      window.acquireVsCodeApi = acquireVsCodeApi;
    </script>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}
