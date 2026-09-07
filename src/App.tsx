import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { parseDocuments, type Document } from "./documents.tsx";
import { NOS } from "./NOS.tsx";
import { SWP, type SpatialMetrics } from "./SWP.tsx";

const EMPTY_SPATIAL_METRICS: SpatialMetrics = {
  moves: 0,
  distance: 0,
  distanceByCard: {},
  initialArea: 0,
  finalArea: 0,
};

const formatMetric = (value: number) => Math.round(value).toLocaleString();

const makeStudyStats = (
  activeView: "nos" | "swp",
  listMoves: number,
  spatial: SpatialMetrics,
  documents: Document[],
) => ({
  version: 1,
  activeView,
  list: { cardMovements: listMoves },
  spatial: {
    cardMovements: spatial.moves,
    totalDistance: spatial.distance,
    cards: documents.map(({ id, title }) => ({
      id,
      title,
      totalDistance: spatial.distanceByCard[id] ?? 0,
    })),
    initialArea: spatial.initialArea,
    finalArea: spatial.finalArea,
    areaChange: spatial.finalArea - spatial.initialArea,
    distanceUnit: "canvas-pixels",
    areaUnit: "canvas-pixels-squared",
    areaMethod: "axis-aligned bounding box",
  },
});

export default function App() {
  const [mode, setMode] = useState<"nos" | "swp">("nos");
  const [spatialOpened, setSpatialOpened] = useState(false);
  const [collectionKey, setCollectionKey] = useState(0);
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadError, setLoadError] = useState("");
  const [listMoves, setListMoves] = useState(0);
  const [spatialMetrics, setSpatialMetrics] = useState(EMPTY_SPATIAL_METRICS);
  const statsDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () =>
        console.log(
          "[Document Study] stats",
          makeStudyStats(mode, listMoves, spatialMetrics, documents),
        ),
      200,
    );
    return () => window.clearTimeout(timeout);
  }, [mode, listMoves, spatialMetrics, documents]);

  const exportStats = () => {
    const stats = {
      ...makeStudyStats(mode, listMoves, spatialMetrics, documents),
      exportedAt: new Date().toISOString(),
    };
    console.log("[Document Study] exported stats", stats);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "study-stats.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setDocuments(parseDocuments(JSON.parse(await file.text())));
      setQuery("");
      setLoadError("");
      setListMoves(0);
      setSpatialMetrics(EMPTY_SPATIAL_METRICS);
      setCollectionKey((key) => key + 1);
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
          {documents.length > 0 && (
            <button
              className="export-button"
              onClick={() => statsDialog.current?.showModal()}
            >
              Export stats
            </button>
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
              onClick={() => {
                setSpatialOpened(true);
                setMode("swp");
              }}
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
      ) : (
        <>
          {mode === "nos" && (
            <NOS
              documents={documents}
              query={query}
              setQuery={setQuery}
              onReorder={setDocuments}
              onMove={() => setListMoves((count) => count + 1)}
            />
          )}
          {spatialOpened && (
            <SWP
              hidden={mode !== "swp"}
              resetKey={collectionKey}
              documents={documents}
              query={query}
              setQuery={setQuery}
              setMetrics={setSpatialMetrics}
            />
          )}
        </>
      )}
      <dialog
        ref={statsDialog}
        className="stats-dialog"
        aria-labelledby="stats-dialog-title"
      >
        <h2 id="stats-dialog-title">Study statistics</h2>
        <p>
          Review this summary before exporting. Current view:{" "}
          <strong>{mode === "nos" ? "List" : "Spatial"}</strong>
        </p>

        <section className="stats-section">
          <h3>List view</h3>
          <div className="stats-summary list-summary">
            <div>
              <span>Card movements</span>
              <strong>{listMoves}</strong>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <h3>Spatial view</h3>
          <p className="metric-description">
            Distance is the straight-line displacement from each drag’s start to
            end, summed across drags in zoom-independent canvas pixels.
          </p>
          <div className="stats-summary spatial-summary">
            <div>
              <span>Card movements</span>
              <strong>{spatialMetrics.moves}</strong>
            </div>
            <div>
              <span>Total distance</span>
              <strong>{formatMetric(spatialMetrics.distance)} px</strong>
            </div>
            <div>
              <span>Area change</span>
              <strong>
                {spatialMetrics.finalArea - spatialMetrics.initialArea >= 0
                  ? "+"
                  : ""}
                {formatMetric(
                  spatialMetrics.finalArea - spatialMetrics.initialArea,
                )}{" "}
                px²
              </strong>
            </div>
          </div>

          <div className="area-summary">
            <h4>Layout area (px²)</h4>
            <p className="metric-description">
              The area of the smallest axis-aligned rectangle containing every
              card, including card dimensions. One px² is one square canvas
              pixel.
            </p>
            <div>
              <span>
                Initial{" "}
                <strong>{formatMetric(spatialMetrics.initialArea)} px²</strong>
              </span>
              <span aria-hidden="true">→</span>
              <span>
                Final{" "}
                <strong>{formatMetric(spatialMetrics.finalArea)} px²</strong>
              </span>
            </div>
          </div>

          <div className="card-distances">
            <h4>Distance by card</h4>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Card</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(({ id, title }) => (
                    <tr key={id}>
                      <td>{title}</td>
                      <td>
                        {formatMetric(spatialMetrics.distanceByCard[id] ?? 0)}{" "}
                        px
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="dialog-actions">
          <button onClick={() => statsDialog.current?.close()}>Cancel</button>
          <button
            className="confirm-button"
            onClick={() => {
              exportStats();
              statsDialog.current?.close();
            }}
          >
            Confirm export
          </button>
        </div>
      </dialog>
    </div>
  );
}
