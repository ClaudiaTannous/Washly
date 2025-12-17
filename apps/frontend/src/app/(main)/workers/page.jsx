"use client";

import { useEffect, useState } from "react";
import SearchFilters from "../../../components/ui/SearchFilters";
import WorkerCard from "../../../components/ui/WorkerCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function fetchWorkers(filters, cursor) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
    } else {
      params.set(key, String(value));
    }
  });

  if (cursor) params.set("cursor", cursor);
  if (!params.has("limit")) params.set("limit", "12");

  const url = `${API_BASE}/api/search/workers?${params.toString()}`;
  console.log("Calling search API:", url);

  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const text = await res.text();
    console.error("Search API error response:", res.status, text);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (!json.ok) {
    console.error("Search API JSON error:", json);
    throw new Error(json.error || "Search failed");
  }

  return json.data;
}

export default function WorkersSearchPage() {
  const [filters, setFilters] = useState({});
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState(null);

  async function load(reset = true) {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkers(filters, reset ? null : nextCursor);

      if (reset) setItems(data.items);
      else setItems((prev) => [...prev, ...data.items]);

      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading results");
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const countLabel =
    items.length > 0 && !firstLoad ? `${items.length} providers found` : "";

  // ===== styles =====
  const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start", // ⬅ no vertical centering
    justifyContent: "center",
    padding: "32px 16px",
    background:
      "radial-gradient(circle at top left, #ffffff 0, #ebf8fb 40%, #e1f3fa 100%)",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "1120px",
    background: "#ffffff",
    borderRadius: "32px",
    padding: "24px 32px 28px",
    boxShadow: "0 24px 60px rgba(15, 73, 107, 0.16)",
    border: "1px solid rgba(198, 223, 234, 0.9)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const headerStyle = {
    textAlign: "center", // ⬅ center title + subtitle
    marginBottom: "4px",
  };

  const headerTitleStyle = {
    margin: 0,
    marginBottom: "6px",
    fontSize: "30px",
    fontWeight: 700,
    color: "#1b2734",
  };

  const headerSubtitleStyle = {
    margin: 0,
    fontSize: "14px",
    color: "#5b6b7b",
  };

  const mainLayoutStyle = {
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr)", // ⬅ filters LEFT, results RIGHT
    gap: "20px",
    alignItems: "flex-start",
  };

  const filtersPanelStyle = {
    background: "#f1f9fd",
    borderRadius: "24px",
    padding: "14px 16px",
    border: "1px solid #d0e4f1",
    boxShadow: "0 16px 30px rgba(169, 205, 225, 0.4)",
    fontSize: "14px",
  };

  const filtersHeaderRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "6px",
  };

  const filtersTitleStyle = {
    fontWeight: 600,
    color: "#1b2734",
    fontSize: "14px",
  };

  const filtersCountStyle = {
    fontSize: "11px",
    color: "#7b8a97",
  };

  const resultsPanelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const resultsTitleStyle = {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#1b2734",
  };

  const resultsSubtitleStyle = {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#7b8a97",
  };

  const resultsListStyle = {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const msgBaseStyle = {
    padding: "10px 14px",
    borderRadius: "18px",
    fontSize: "14px",
  };

  const msgErrorStyle = {
    ...msgBaseStyle,
    background: "#fdeaea",
    border: "1px solid #f5b3b3",
    color: "#a12b2b",
  };

  const msgEmptyStyle = {
    ...msgBaseStyle,
    background: "#f5f9ff",
    border: "1px dashed #c6d9ee",
    color: "#4b5c6e",
    textAlign: "center",
  };

  const footerRowStyle = {
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const loadMoreBtnStyle = {
    borderRadius: "999px",
    padding: "8px 18px",
    fontSize: "13px",
    border: "1px solid #86becc",
    background: "#ffffff",
    color: "#1c6d86",
    boxShadow: "0 10px 24px rgba(110, 172, 197, 0.35)",
    cursor: "pointer",
  };

  const noMoreStyle = {
    fontSize: "12px",
    color: "#7b8a97",
  };

  return (
    <div style={pageStyle} dir="ltr">
      <div style={cardStyle}>
        {/* header */}
        <header style={headerStyle}>
          <h1 style={headerTitleStyle}>Laundry Service Provider Search</h1>
          <p style={headerSubtitleStyle}>
            Find a student, private provider, or laundromat by location,
            services, price, and rating.
          </p>
        </header>

        {/* filters + results */}
        <div style={mainLayoutStyle}>
          {/* LEFT – filters */}
          <aside style={filtersPanelStyle}>
            <div style={filtersHeaderRowStyle}>
              <span style={filtersTitleStyle}>Filters</span>
              <span style={filtersCountStyle}>{countLabel}</span>
            </div>
            <SearchFilters onApply={setFilters} />
          </aside>

          {/* RIGHT – results */}
          <main style={resultsPanelStyle}>
            <div>
              <h2 style={resultsTitleStyle}>Available Providers</h2>
              <p style={resultsSubtitleStyle}>
                {items.length > 0 && !firstLoad
                  ? `${items.length} providers found`
                  : firstLoad
                  ? "Loading results..."
                  : "No results found"}
              </p>
            </div>

            {error && <div style={msgErrorStyle}>{error}</div>}

            <div style={resultsListStyle}>
              {items.map((worker) => (
                <WorkerCard key={worker.worker_id} worker={worker} />
              ))}
            </div>

            {items.length === 0 && !firstLoad && !loading && !error && (
              <div style={msgEmptyStyle}>
                No providers match your search. Try adjusting the filters 🙂
              </div>
            )}

            <div style={footerRowStyle}>
              {nextCursor && (
                <button
                  type="button"
                  style={loadMoreBtnStyle}
                  onClick={() => load(false)}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              )}

              {!nextCursor && items.length > 0 && (
                <span style={noMoreStyle}>No more results to show</span>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
