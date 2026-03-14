import * as vscode from "vscode";
import { WorkspaceService } from "../workspace/workspaceService";

export async function exportGraphJson(workspaceService: WorkspaceService): Promise<void> {
  await workspaceService.refresh();
  const uri = await workspaceService.exportGraph();

  if (!uri) {
    void vscode.window.showWarningMessage("No workspace folder is open.");
    return;
  }

  void vscode.window.showInformationMessage(`Graph exported to ${uri.fsPath}`);
}
