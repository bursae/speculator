import * as path from "path";
import * as vscode from "vscode";
import { ParseIssue } from "../models/types";

export class DiagnosticsManager {
  private readonly collection = vscode.languages.createDiagnosticCollection("linkAnalysis");

  dispose(): void {
    this.collection.dispose();
  }

  publish(issuesByFile: Map<string, ParseIssue[]>): void {
    this.collection.clear();

    for (const [filePath, issues] of issuesByFile.entries()) {
      const diagnostics = issues.map((issue) => {
        const lineIndex = Math.max(issue.line - 1, 0);
        return new vscode.Diagnostic(
          new vscode.Range(lineIndex, 0, lineIndex, Number.MAX_SAFE_INTEGER),
          issue.message,
          issue.severity === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
        );
      });

      this.collection.set(vscode.Uri.file(path.resolve(filePath)), diagnostics);
    }
  }
}
