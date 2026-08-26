import { useState, type DragEvent, type KeyboardEvent } from "react";
import { Highlight, matches, type Document } from "./documents.tsx";

type Props = {
  document: Document;
  index: number;
  documentCount: number;
  query: string;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, targetIndex: number) => void;
};

export function DocumentRow({
  document,
  index,
  documentCount,
  query,
  selected,
  onSelect,
  onMove,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const found = Boolean(query.trim()) && matches(document, query);

  const startDrag = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", document.id);
    setDragging(true);
  };

  const allowDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(true);
  };

  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onMove(event.dataTransfer.getData("text/plain"), index);
    setDropTarget(false);
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    onMove(
      document.id,
      Math.max(
        0,
        Math.min(documentCount - 1, index + (event.key === "ArrowUp" ? -1 : 1)),
      ),
    );
  };

  return (
    <button
      draggable
      className={`${selected ? "selected" : ""} ${found ? "match" : ""} ${dragging ? "dragging" : ""} ${dropTarget ? "drop-target" : ""}`}
      onClick={onSelect}
      onDragStart={startDrag}
      onDragOver={allowDrop}
      onDragLeave={() => setDropTarget(false)}
      onDrop={drop}
      onDragEnd={() => {
        setDragging(false);
        setDropTarget(false);
      }}
      onKeyDown={moveWithKeyboard}
      title="Drag to reorder, or use Alt + Up/Down"
    >
      <span>
        <strong>
          <Highlight text={document.title} query={query} />
        </strong>
        <small>
          <Highlight text={document.content.slice(0, 70)} query={query} />…
        </small>
      </span>
    </button>
  );
}
