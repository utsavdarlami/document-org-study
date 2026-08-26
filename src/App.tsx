import { useState, type ChangeEvent, type ReactNode } from "react";
import { parseDocuments, type Document } from "./documents.tsx";
import { NOS } from "./NOS.tsx";
import { SWP } from "./SWP.tsx";

export default function App(): ReactNode {
  const [mode, setMode] = useState<"nos" | "swp">("nos");
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadError, setLoadError] = useState("");

  const loadJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setDocuments(parseDocuments(JSON.parse(await file.text())));
      setQuery("");
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load that file.",
      );
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="logo">D</span>
          <strong>Document Study</strong>
        </div>
        <div className="header-actions">
          {loadError && (
            <span className="load-error" role="alert">
              {loadError}
            </span>
          )}
          <label className="load-button">
            Load JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={loadJson}
            />
          </label>
          <div className="mode-picker" role="group" aria-label="Workspace mode">
            <button
              className={mode === "nos" ? "active" : ""}
              onClick={() => setMode("nos")}
            >
              List view
            </button>
            <button
              className={mode === "swp" ? "active" : ""}
              onClick={() => setMode("swp")}
            >
              Spatial workspace
            </button>
          </div>
        </div>
      </header>
      {documents.length === 0 ? (
        <main className="empty-state">
          <p className="eyebrow">No documents loaded</p>
          <h1>Load a JSON collection to begin.</h1>
          <p>
            Use the Load JSON button above. A sample file is available in the
            examples directory.
          </p>
        </main>
      ) : mode === "nos" ? (
        <NOS documents={documents} query={query} setQuery={setQuery} />
      ) : (
        <SWP documents={documents} query={query} setQuery={setQuery} />
      )}
    </div>
  );
}
