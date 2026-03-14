import { buildGraph } from "../src/graph/graphBuilder";
import { parseLinkFile } from "../src/parser/parser";

describe("parseLinkFile", () => {
  it("parses entities, relationships, and events", () => {
    const parsed = parseLinkFile(
      "example.link.md",
      `[person] John Smith
[org] Acme Holdings
John Smith -> Acme Holdings : director
2026-03-10 | meeting | John Smith | Acme Holdings | Newark Port`
    );

    expect(parsed.entities).toHaveLength(2);
    expect(parsed.relationships).toHaveLength(1);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.events[0]).toMatchObject({
      date: "2026-03-10",
      label: "meeting",
      participants: ["John Smith", "Acme Holdings"],
      location: "Newark Port"
    });
  });

  it("reports malformed structured lines and ignores unrelated text", () => {
    const parsed = parseLinkFile(
      "bad.link.md",
      `[person]
Broken -> : edge
2026-99-10 | meeting |
freeform analyst note`
    );

    expect(parsed.issues).toHaveLength(3);
    expect(parsed.issues.map((issue) => issue.message)).toEqual([
      "Malformed entity line.",
      "Malformed relationship line.",
      "Malformed event line."
    ]);
  });
});

describe("buildGraph", () => {
  it("keeps the first duplicate entity and reports diagnostics", () => {
    const parsedA = parseLinkFile("a.link.md", "[person] John Smith");
    const parsedB = parseLinkFile(
      "b.link.md",
      `[person] John Smith
John Smith -> Missing Co : advisor`
    );

    const result = buildGraph([parsedA, parsedB]);

    expect(result.graph.entities).toHaveLength(1);
    expect(result.issuesByFile.get("b.link.md")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Duplicate entity definition for "John Smith".' }),
        expect.objectContaining({ message: 'Unknown entity referenced in relationship target: "Missing Co".' })
      ])
    );
  });
});
