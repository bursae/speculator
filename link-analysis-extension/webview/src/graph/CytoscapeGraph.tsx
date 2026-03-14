import { useEffect, useRef } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";

type EntityType = "person" | "org" | "place" | "asset";

interface Entity {
  id: string;
  name: string;
  type: EntityType;
  filePath: string;
  line: number;
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  filePath: string;
  line: number;
}

interface EventRecord {
  id: string;
  date: string;
  label: string;
  participants: string[];
  location?: string;
  filePath: string;
  line: number;
}

interface GraphModel {
  entities: Entity[];
  relationships: Relationship[];
  events: EventRecord[];
}

interface Props {
  graph: GraphModel;
  search: string;
  focusTarget: { kind: "entity" | "relationship" | "event"; id: string } | undefined;
  onSelectEntity: (entity: Entity) => void;
  onSelectRelationship: (relationship: Relationship) => void;
}

const TYPE_COLORS: Record<EntityType, string> = {
  person: "#d88c45",
  org: "#34657f",
  place: "#4d7d62",
  asset: "#7a5a9a"
};

function buildElements(graph: GraphModel): ElementDefinition[] {
  const nodeElements = graph.entities.map((entity) => ({
    data: {
      id: entity.id,
      label: entity.name,
      type: entity.type
    }
  }));

  const edgeElements = graph.relationships.map((relationship) => ({
    data: {
      id: relationship.id,
      source: relationship.sourceId,
      target: relationship.targetId,
      label: relationship.label
    }
  }));

  return [...nodeElements, ...edgeElements];
}

export default function CytoscapeGraph({
  graph,
  search,
  focusTarget,
  onSelectEntity,
  onSelectRelationship
}: Props): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const cy = cytoscape({
      container: hostRef.current,
      elements: buildElements(graph),
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": (ele) => TYPE_COLORS[ele.data("type") as EntityType],
            color: "#f8f7f3",
            "font-size": "11px",
            "text-wrap": "wrap",
            "text-max-width": "100px",
            "text-valign": "center",
            "text-halign": "center",
            width: 38,
            height: 38,
            "border-width": 2,
            "border-color": "#f0dfc2"
          }
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            width: 2,
            color: "#d3c9b0",
            "font-size": "10px",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "line-color": "#607d8b",
            "target-arrow-color": "#607d8b"
          }
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.18
          }
        },
        {
          selector: ".focused",
          style: {
            "border-width": 5,
            "line-color": "#f0dfc2",
            "target-arrow-color": "#f0dfc2"
          }
        }
      ],
      layout: {
        name: "cose",
        animate: false,
        fit: true,
        padding: 40
      }
    });

    cy.on("tap", "node", (event) => {
      const entity = graph.entities.find((item) => item.id === event.target.id());
      if (entity) {
        onSelectEntity(entity);
      }
    });

    cy.on("tap", "edge", (event) => {
      const relationship = graph.relationships.find((item) => item.id === event.target.id());
      if (relationship) {
        onSelectRelationship(relationship);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, onSelectEntity, onSelectRelationship]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    const query = search.trim().toLowerCase();
    cy.elements().removeClass("dimmed");

    if (!query) {
      return;
    }

    const matchedNodes = cy.nodes().filter((node) => String(node.data("label")).toLowerCase().includes(query));
    const connected = matchedNodes.union(matchedNodes.connectedEdges()).union(matchedNodes.connectedEdges().connectedNodes());
    cy.elements().difference(connected).addClass("dimmed");

    if (matchedNodes.length > 0) {
      cy.fit(matchedNodes, 80);
    }
  }, [graph, search]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !focusTarget || focusTarget.kind === "event") {
      return;
    }

    cy.elements().removeClass("focused");
    const element = cy.getElementById(focusTarget.id);
    if (element.nonempty()) {
      element.addClass("focused");
      cy.animate({
        fit: {
          eles: element.closedNeighborhood(),
          padding: 90
        },
        duration: 250
      });
    }
  }, [focusTarget, graph]);

  return <div className="graph-canvas" ref={hostRef} />;
}
