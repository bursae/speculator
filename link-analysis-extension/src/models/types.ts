export type EntityType = "person" | "org" | "place" | "asset";

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  filePath: string;
  line: number;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  filePath: string;
  line: number;
}

export interface EventRecord {
  id: string;
  date: string;
  label: string;
  participants: string[];
  location?: string;
  filePath: string;
  line: number;
}

export interface GraphModel {
  entities: Entity[];
  relationships: Relationship[];
  events: EventRecord[];
}

export type IssueSeverity = "error" | "warning";

export interface ParseIssue {
  message: string;
  line: number;
  severity: IssueSeverity;
}

export interface ParsedEntityDefinition {
  type: EntityType;
  name: string;
  filePath: string;
  line: number;
}

export interface ParsedRelationshipDefinition {
  sourceName: string;
  targetName: string;
  label: string;
  filePath: string;
  line: number;
}

export interface ParsedEventDefinition {
  date: string;
  label: string;
  participants: string[];
  location?: string;
  filePath: string;
  line: number;
}

export interface ParsedFile {
  filePath: string;
  entities: ParsedEntityDefinition[];
  relationships: ParsedRelationshipDefinition[];
  events: ParsedEventDefinition[];
  issues: ParseIssue[];
}

export type RevealableKind = "entity" | "relationship" | "event";

export interface RevealableLocation {
  filePath: string;
  line: number;
  kind: RevealableKind;
}
