import {
  Entity,
  EventRecord,
  GraphModel,
  ParsedFile,
  ParseIssue,
  Relationship,
  RevealableLocation
} from "../models/types";
import { hashString } from "../util/hash";
import { slugifyName } from "../util/slug";

export interface GraphBuildResult {
  graph: GraphModel;
  issuesByFile: Map<string, ParseIssue[]>;
  entityById: Map<string, Entity>;
  relationshipById: Map<string, Relationship>;
  eventById: Map<string, EventRecord>;
  locationByKey: Map<string, RevealableLocation>;
}

function pushIssue(map: Map<string, ParseIssue[]>, filePath: string, issue: ParseIssue): void {
  const existing = map.get(filePath) ?? [];
  existing.push(issue);
  map.set(filePath, existing);
}

function createUniqueEntityId(baseId: string, usedIds: Set<string>, filePath: string, line: number): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  const candidate = `${baseId}_${hashString(`${filePath}:${line}`)}`;
  usedIds.add(candidate);
  return candidate;
}

export function buildGraph(parsedFiles: ParsedFile[]): GraphBuildResult {
  const issuesByFile = new Map<string, ParseIssue[]>();
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const events: EventRecord[] = [];
  const entityById = new Map<string, Entity>();
  const relationshipById = new Map<string, Relationship>();
  const eventById = new Map<string, EventRecord>();
  const locationByKey = new Map<string, RevealableLocation>();
  const entityByName = new Map<string, Entity>();
  const usedEntityIds = new Set<string>();

  parsedFiles.forEach((parsedFile) => {
    parsedFile.issues.forEach((issue) => pushIssue(issuesByFile, parsedFile.filePath, issue));
  });

  for (const parsedFile of parsedFiles) {
    for (const definition of parsedFile.entities) {
      if (entityByName.has(definition.name)) {
        pushIssue(issuesByFile, definition.filePath, {
          line: definition.line,
          message: `Duplicate entity definition for "${definition.name}".`,
          severity: "error"
        });
        continue;
      }

      const entity: Entity = {
        id: createUniqueEntityId(slugifyName(definition.name), usedEntityIds, definition.filePath, definition.line),
        name: definition.name,
        type: definition.type,
        filePath: definition.filePath,
        line: definition.line
      };

      entities.push(entity);
      entityById.set(entity.id, entity);
      entityByName.set(entity.name, entity);
      locationByKey.set(`entity:${entity.id}`, {
        filePath: entity.filePath,
        line: entity.line,
        kind: "entity"
      });
    }
  }

  for (const parsedFile of parsedFiles) {
    for (const definition of parsedFile.relationships) {
      const source = entityByName.get(definition.sourceName);
      const target = entityByName.get(definition.targetName);

      if (!source || !target) {
        if (!source) {
          pushIssue(issuesByFile, definition.filePath, {
            line: definition.line,
            message: `Unknown entity referenced in relationship source: "${definition.sourceName}".`,
            severity: "error"
          });
        }

        if (!target) {
          pushIssue(issuesByFile, definition.filePath, {
            line: definition.line,
            message: `Unknown entity referenced in relationship target: "${definition.targetName}".`,
            severity: "error"
          });
        }
        continue;
      }

      const relationship: Relationship = {
        id: `rel_${hashString(`${definition.filePath}:${definition.line}:${definition.sourceName}:${definition.targetName}:${definition.label}`)}`,
        sourceId: source.id,
        targetId: target.id,
        label: definition.label,
        filePath: definition.filePath,
        line: definition.line
      };

      relationships.push(relationship);
      relationshipById.set(relationship.id, relationship);
      locationByKey.set(`relationship:${relationship.id}`, {
        filePath: relationship.filePath,
        line: relationship.line,
        kind: "relationship"
      });
    }

    for (const definition of parsedFile.events) {
      const unknownParticipants = definition.participants.filter((participant) => !entityByName.has(participant));
      const locationIsUnknown = definition.location && !entityByName.has(definition.location);

      unknownParticipants.forEach((participant) => {
        pushIssue(issuesByFile, definition.filePath, {
          line: definition.line,
          message: `Unknown entity referenced in event: "${participant}".`,
          severity: "warning"
        });
      });

      if (locationIsUnknown) {
        pushIssue(issuesByFile, definition.filePath, {
          line: definition.line,
          message: `Unknown event location referenced: "${definition.location}".`,
          severity: "warning"
        });
      }

      const event: EventRecord = {
        id: `event_${hashString(`${definition.filePath}:${definition.line}:${definition.date}:${definition.label}`)}`,
        date: definition.date,
        label: definition.label,
        participants: definition.participants,
        location: definition.location,
        filePath: definition.filePath,
        line: definition.line
      };

      events.push(event);
      eventById.set(event.id, event);
      locationByKey.set(`event:${event.id}`, {
        filePath: event.filePath,
        line: event.line,
        kind: "event"
      });
    }
  }

  return {
    graph: {
      entities,
      relationships,
      events
    },
    issuesByFile,
    entityById,
    relationshipById,
    eventById,
    locationByKey
  };
}
