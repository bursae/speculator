import {
  ParsedEntityDefinition,
  ParsedEventDefinition,
  ParsedFile,
  ParsedRelationshipDefinition
} from "../models/types";

const ENTITY_REGEX = /^\[(person|org|place|asset)\]\s+(.+)$/;
const RELATIONSHIP_REGEX = /^(.+?)\s*->\s*(.+?)\s*:\s*(.+)$/;
const EVENT_REGEX = /^(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*(.+)$/;

function isValidDate(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

function parseEventPayload(payload: string): Pick<ParsedEventDefinition, "participants" | "location"> | null {
  const rawParts = payload.split("|").map((part) => part.trim()).filter(Boolean);

  if (rawParts.length === 0) {
    return null;
  }

  if (rawParts.length === 1) {
    return {
      participants: [rawParts[0]]
    };
  }

  return {
    participants: rawParts.slice(0, -1),
    location: rawParts[rawParts.length - 1]
  };
}

export function parseLinkFile(filePath: string, content: string): ParsedFile {
  const entities: ParsedEntityDefinition[] = [];
  const relationships: ParsedRelationshipDefinition[] = [];
  const events: ParsedEventDefinition[] = [];
  const issues: ParsedFile["issues"] = [];

  const lines = content.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const entityMatch = line.match(ENTITY_REGEX);
    if (entityMatch) {
      const [, type, name] = entityMatch;
      entities.push({
        type: type as ParsedEntityDefinition["type"],
        name: name.trim(),
        filePath,
        line: lineNumber
      });
      return;
    }

    if (line.startsWith("[")) {
      issues.push({
        line: lineNumber,
        message: "Malformed entity line.",
        severity: "error"
      });
      return;
    }

    const relationshipMatch = line.match(RELATIONSHIP_REGEX);
    if (relationshipMatch) {
      const [, sourceName, targetName, label] = relationshipMatch;
      relationships.push({
        sourceName: sourceName.trim(),
        targetName: targetName.trim(),
        label: label.trim(),
        filePath,
        line: lineNumber
      });
      return;
    }

    if (line.includes("->")) {
      issues.push({
        line: lineNumber,
        message: "Malformed relationship line.",
        severity: "error"
      });
      return;
    }

    const eventMatch = line.match(EVENT_REGEX);
    if (eventMatch) {
      const [, date, label, payload] = eventMatch;

      if (!isValidDate(date)) {
        issues.push({
          line: lineNumber,
          message: "Malformed event line: invalid date.",
          severity: "error"
        });
        return;
      }

      const parsedPayload = parseEventPayload(payload);
      if (!parsedPayload) {
        issues.push({
          line: lineNumber,
          message: "Malformed event line.",
          severity: "error"
        });
        return;
      }

      events.push({
        date,
        label: label.trim(),
        participants: parsedPayload.participants,
        location: parsedPayload.location,
        filePath,
        line: lineNumber
      });
      return;
    }

    if (/^\d{4}-\d{2}-\d{2}\b/.test(line) || line.includes("|")) {
      issues.push({
        line: lineNumber,
        message: "Malformed event line.",
        severity: "error"
      });
    }
  });

  return {
    filePath,
    entities,
    relationships,
    events,
    issues
  };
}
