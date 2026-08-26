import type { ReactNode } from "react";

export type Document = {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
};

export function parseDocuments(value: unknown): Document[] {
  if (!value || typeof value !== "object" || !("documents" in value)) {
    throw new Error('JSON must contain a "documents" array.');
  }
  const items = (value as { documents: unknown }).documents;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('"documents" must be a non-empty array.');
  }
  const documents = items.filter(
    (item): item is Document =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as Document).id === "string" &&
      typeof (item as Document).title === "string" &&
      typeof (item as Document).content === "string" &&
      (!("metadata" in item) ||
        (typeof item.metadata === "object" &&
          item.metadata !== null &&
          !Array.isArray(item.metadata))),
  );
  if (
    documents.length !== items.length ||
    new Set(documents.map(({ id }) => id)).size !== documents.length
  ) {
    throw new Error(
      "Each document needs a unique string id, title, and content.",
    );
  }
  return documents;
}

export const matches = (document: Document, query: string) =>
  !query.trim() ||
  `${document.title} ${document.content}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());

export function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return text;
  const highlighted: ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  let cursor = 0;
  let match = lowerText.indexOf(lowerTerm);
  while (match !== -1) {
    highlighted.push(
      text.slice(cursor, match),
      <mark key={match}>{text.slice(match, match + term.length)}</mark>,
    );
    cursor = match + term.length;
    match = lowerText.indexOf(lowerTerm, cursor);
  }
  highlighted.push(text.slice(cursor));
  return highlighted;
}

export function Search({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="search">
      <span aria-hidden="true">⌕</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search documents"
        aria-label="Search documents"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search">
          ×
        </button>
      )}
    </label>
  );
}
