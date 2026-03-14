import * as vscode from "vscode";
import { Entity, EventRecord, GraphModel, RevealableKind } from "../models/types";

type CategoryKey = "person" | "org" | "place" | "asset" | "events";

interface CategoryNode {
  kind: "category";
  category: CategoryKey;
  label: string;
}

interface EntityNode {
  kind: "entity";
  entity: Entity;
}

interface EventNode {
  kind: "event";
  event: EventRecord;
}

type TreeNode = CategoryNode | EntityNode | EventNode;

const CATEGORY_ORDER: CategoryNode[] = [
  { kind: "category", category: "person", label: "People" },
  { kind: "category", category: "org", label: "Organizations" },
  { kind: "category", category: "place", label: "Places" },
  { kind: "category", category: "asset", label: "Assets" },
  { kind: "category", category: "events", label: "Events" }
];

export class EntityTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly changeEmitter = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  private graph: GraphModel = { entities: [], relationships: [], events: [] };

  setGraph(graph: GraphModel): void {
    this.graph = graph;
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    if (element.kind === "category") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
      return item;
    }

    if (element.kind === "event") {
      const item = new vscode.TreeItem(
        `${element.event.date} - ${element.event.label}`,
        vscode.TreeItemCollapsibleState.None
      );
      item.command = {
        command: "linkAnalysis.revealItem",
        title: "Reveal Event",
        arguments: [{ kind: "event" as RevealableKind, id: element.event.id }]
      };
      item.description = element.event.location;
      return item;
    }

    const item = new vscode.TreeItem(element.entity.name, vscode.TreeItemCollapsibleState.None);
    item.description = element.entity.type;
    item.command = {
      command: "linkAnalysis.revealItem",
      title: "Reveal Entity",
      arguments: [{ kind: "entity" as RevealableKind, id: element.entity.id }]
    };
    return item;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    if (!element) {
      return Promise.resolve(CATEGORY_ORDER);
    }

    if (element.kind !== "category") {
      return Promise.resolve([]);
    }

    if (element.category === "events") {
      return Promise.resolve(this.graph.events.map((event) => ({ kind: "event", event })));
    }

    return Promise.resolve(
      this.graph.entities
        .filter((entity) => entity.type === element.category)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((entity) => ({ kind: "entity", entity }))
    );
  }
}
