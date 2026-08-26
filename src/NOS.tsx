import { useEffect, useState } from "react";
import { Highlight, matches, Search, type Document } from "./documents.tsx";

type Props = {
  documents: Document[];
  query: string;
  setQuery: (query: string) => void;
};

export function NOS({ documents, query, setQuery }: Props) {
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

  return (
    <main className="nos">
      <aside className="document-list">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Documents</h2>
          </div>
          <span>{documents.length}</span>
        </div>
        <Search value={query} onChange={setQuery} />
        <nav aria-label="Documents">
          {documents.map((document, index) => {
            const found = Boolean(query.trim()) && matches(document, query);
            return (
              <button
                key={document.id}
                className={`${selectedId === document.id ? "selected" : ""} ${found ? "match" : ""}`}
                onClick={() => setSelectedId(document.id)}
              >
                <span className="document-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>
                    <Highlight text={document.title} query={query} />
                  </strong>
                  <small>
                    <Highlight
                      text={document.content.slice(0, 70)}
                      query={query}
                    />
                    …
                  </small>
                </span>
              </button>
            );
          })}
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
