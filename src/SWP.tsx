import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  Background,
  Controls,
  NodeResizer,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Highlight, matches, Search, type Document } from "./documents.tsx";

export type SpatialMetrics = {
  moves: number;
  distance: number;
  distanceByCard: Record<string, number>;
  initialArea: number;
  finalArea: number;
};

type Props = {
  hidden: boolean;
  resetKey: number;
  documents: Document[];
  query: string;
  setQuery: (query: string) => void;
  setMetrics: Dispatch<SetStateAction<SpatialMetrics>>;
};

type DocumentNode = Node<{ document: Document; query: string }, "document">;

function DocumentCard({ data, selected }: NodeProps<DocumentNode>) {
  const found =
    Boolean(data.query.trim()) && matches(data.document, data.query);
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={150}
        color="#777771"
      />
      <article className={`flow-card ${found ? "match" : ""}`}>
        <h3>
          <Highlight text={data.document.title} query={data.query} />
        </h3>
        <p>
          <Highlight text={data.document.content} query={data.query} />
        </p>
      </article>
    </>
  );
}

const NODE_TYPES = { document: DocumentCard };
const CARD_WIDTH = 285;
const CARD_HEIGHT = 225;

const makeNodes = (documents: Document[]): DocumentNode[] =>
  documents.map((document, index) => ({
    id: document.id,
    type: "document",
    position: {
      x: 55 + (index % 3) * 335,
      y: 55 + Math.floor(index / 3) * 285,
    },
    data: { document, query: "" },
    style: { width: CARD_WIDTH, height: CARD_HEIGHT },
    draggable: true,
    connectable: false,
  }));

const layoutArea = (nodes: DocumentNode[]) => {
  if (!nodes.length) return 0;
  const rectangles = nodes.map((node) => ({
    left: node.position.x,
    top: node.position.y,
    right:
      node.position.x +
      (node.measured?.width ??
        (typeof node.style?.width === "number"
          ? node.style.width
          : CARD_WIDTH)),
    bottom:
      node.position.y +
      (node.measured?.height ??
        (typeof node.style?.height === "number"
          ? node.style.height
          : CARD_HEIGHT)),
  }));
  const width =
    Math.max(...rectangles.map(({ right }) => right)) -
    Math.min(...rectangles.map(({ left }) => left));
  const height =
    Math.max(...rectangles.map(({ bottom }) => bottom)) -
    Math.min(...rectangles.map(({ top }) => top));
  return width * height;
};

export function SWP({
  hidden,
  resetKey,
  documents,
  query,
  setQuery,
  setMetrics,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DocumentNode>(
    makeNodes(documents),
  );
  const dragStart = useRef<{ id: string; x: number; y: number } | null>(null);
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, data: { ...node.data, query } })),
    );
  }, [query, setNodes]);

  useEffect(() => {
    const initialNodes = makeNodes(documents);
    const initialArea = layoutArea(initialNodes);
    setNodes(initialNodes);
    setMetrics({
      moves: 0,
      distance: 0,
      distanceByCard: {},
      initialArea,
      finalArea: initialArea,
    });
  }, [resetKey, setMetrics, setNodes]);

  useEffect(() => {
    const finalArea = layoutArea(nodes);
    setMetrics((current) =>
      current.finalArea === finalArea ? current : { ...current, finalArea },
    );
  }, [nodes, setMetrics]);

  return (
    <main className="swp" hidden={hidden}>
      <div className="canvas-toolbar">
        <div>
          <p className="eyebrow">Free canvas</p>
          <h2>Workspace</h2>
        </div>
        <Search value={query} onChange={setQuery} />
      </div>
      <div className="canvas">
        <ReactFlow
          nodes={nodes}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onNodeDragStart={(_, node) => {
            dragStart.current = { id: node.id, ...node.position };
          }}
          onNodeDragStop={(_, node) => {
            const start = dragStart.current;
            dragStart.current = null;
            if (!start || start.id !== node.id) return;
            const distance = Math.hypot(
              node.position.x - start.x,
              node.position.y - start.y,
            );
            if (!distance) return;
            setMetrics((current) => ({
              ...current,
              moves: current.moves + 1,
              distance: current.distance + distance,
              distanceByCard: {
                ...current.distanceByCard,
                [node.id]: (current.distanceByCard[node.id] ?? 0) + distance,
              },
            }));
          }}
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.35}
          maxZoom={1.5}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#deded9" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </main>
  );
}
