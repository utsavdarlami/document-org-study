import { useEffect, useState } from "react";
import { Highlight, matches, Search, type Document } from "./documents.tsx";
import { DocumentRow } from "./DocumentRow.tsx";

type Props = {
  documents: Document[];
  query: string;
  setQuery: (query: string) => void;
  onReorder: (documents: Document[]) => void;
};

export function NOS({ documents, query, setQuery, onReorder }: Props) {
  const [selectedId, setSelectedId] = useState(documents[0].id);
  const selected =
    documents.find((document) => document.id === selectedId) ?? documents[0];

  useEffect(() => {
    if (!documents.some(({ id }) => id === selectedId)) {
      setSelectedId(documents[0].id);
      return;
    }
    if (!query.trim() || matches(selected, query)) return;
    const firstMatch = documents.find((document) => matches(document, query));
    if (firstMatch) setSelectedId(firstMatch.id);
  }, [documents, query, selected, selectedId]);

  const moveDocument = (id: string, targetIndex: number) => {
    const sourceIndex = documents.findIndex((document) => document.id === id);
    if (sourceIndex < 0 || sourceIndex === targetIndex) return;
    const reordered = [...documents];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <main className="nos">
      <aside className="document-list">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Documents</h2>
          </div>
        </div>
        <Search value={query} onChange={setQuery} />
        <nav aria-label="Documents">
          {documents.map((document, index) => (
            <DocumentRow
              key={document.id}
              document={document}
              index={index}
              documentCount={documents.length}
              query={query}
              selected={selectedId === document.id}
              onSelect={() => setSelectedId(document.id)}
              onMove={moveDocument}
            />
          ))}
        </nav>
      </aside>

      <article className="viewer">
        <p className="eyebrow">Document</p>
        <h1>
          <Highlight text={selected.title} query={query} />
        </h1>
        <div className="rule" />
        <p>
          <Highlight text={selected.content} query={query} />
        </p>
      </article>
    </main>
  );
}
