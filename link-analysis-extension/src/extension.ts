import * as vscode from "vscode";
import { exportGraphJson } from "./commands/exportGraphJson";
import { DiagnosticsManager } from "./diagnostics/diagnosticsManager";
import { EntityTreeProvider } from "./tree/entityTreeProvider";
import { GraphPanel } from "./webview/graphPanel";
import { WorkspaceService } from "./workspace/workspaceService";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const diagnosticsManager = new DiagnosticsManager();
  const treeProvider = new EntityTreeProvider();
  const graphPanel = new GraphPanel(context.extensionUri);
  const workspaceService = new WorkspaceService(diagnosticsManager, treeProvider, graphPanel);

  graphPanel.onDidReceiveSelection((message) => {
    if (message.type === "node:selected") {
      void workspaceService.reveal("entity", message.payload.id);
    }

    if (message.type === "edge:selected") {
      void workspaceService.reveal("relationship", message.payload.id);
    }
  });

  context.subscriptions.push(
    diagnosticsManager,
    workspaceService,
    vscode.window.registerTreeDataProvider("linkAnalysis.entities", treeProvider),
    vscode.commands.registerCommand("linkAnalysis.openGraph", async () => {
      const result = await workspaceService.refresh();
      graphPanel.reveal(result.graph);
    }),
    vscode.commands.registerCommand("linkAnalysis.refreshGraph", async () => {
      await workspaceService.refresh();
    }),
    vscode.commands.registerCommand("linkAnalysis.validateWorkspace", async () => {
      await workspaceService.refresh();
      void vscode.window.showInformationMessage("Link analysis workspace validated.");
    }),
    vscode.commands.registerCommand("linkAnalysis.exportGraphJson", async () => {
      await exportGraphJson(workspaceService);
    }),
    vscode.commands.registerCommand(
      "linkAnalysis.revealItem",
      async (target: { kind: "entity" | "relationship" | "event"; id: string }) => {
        await workspaceService.reveal(target.kind, target.id);
      }
    )
  );

  await workspaceService.initialize();
}

export function deactivate(): void {}
