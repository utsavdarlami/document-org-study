import { useEffect } from "react";
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

type Props = {
  documents: Document[];
  query: string;
  setQuery: (query: string) => void;
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

const makeNodes = (documents: Document[]): DocumentNode[] =>
  documents.map((document, index) => ({
    id: document.id,
    type: "document",
    position: {
      x: 55 + (index % 3) * 335,
      y: 55 + Math.floor(index / 3) * 285,
    },
    data: { document, query: "" },
    style: { width: 285, height: 225 },
    draggable: true,
    connectable: false,
  }));

export function SWP({ documents, query, setQuery }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DocumentNode>(
    makeNodes(documents),
  );
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({ ...node, data: { ...node.data, query } })),
    );
  }, [query, setNodes]);

  useEffect(() => {
    setNodes(makeNodes(documents));
  }, [documents, setNodes]);

  return (
    <main className="swp">
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
