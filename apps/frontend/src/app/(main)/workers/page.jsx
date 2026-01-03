"use client";

import { useEffect, useMemo, useState } from "react";
import SearchFilters from "@/components/ui/SearchFilters";
import WorkerCard from "@/components/ui/WorkerCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

/**
 * Supports:
 * - city (required)
 * - pickup_at (required) ISO string
 * - service_codes (optional) comma-separated list
 * - other optional filters: is_professional, pickup, delivery, minRating, maxPrice
 */
async function fetchWorkers(filters, cursor) {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    // multi-services support
    if (key === "service_codes" && Array.isArray(value)) {
      if (value.length) params.set("service_codes", value.join(","));
      return;
    }

    params.set(key, String(value));
  });

  if (cursor) params.set("cursor", cursor);
  if (!params.has("limit")) params.set("limit", "12");

  const url = `${API_BASE}/api/search/workers?${params.toString()}`;
  const res = await fetch(url);

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      json?.error || `HTTP ${res.status}: ${await res.text()}`
    );
  }
  if (!json?.ok) throw new Error(json?.error || "Search failed");

  return json.data; // { items, nextCursor }
}

export default function WorkersSearchPage() {
  // REQUIRED top fields
  const [city, setCity] = useState("");
  const [pickupAt, setPickupAt] = useState(""); // datetime-local string

  // City dropdown data (from DB)
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");

  // Sidebar advanced filters (service multi-select lives there)
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Services list for sidebar
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");

  // Search state
  const [submittedFilters, setSubmittedFilters] = useState(null); // null => not submitted
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState(null);

  // validation
  const [touched, setTouched] = useState({ city: false, pickupAt: false });

  // Load cities from DB
  useEffect(() => {
    let alive = true;

    async function loadCities() {
      try {
        setCitiesError("");
        const res = await fetch(`${API_BASE}/api/search/cities`);
        const json = await res.json();
        if (!res.ok || !json?.ok)
          throw new Error(json?.error || "Failed to load cities");

        if (alive) setCities(Array.isArray(json.data) ? json.data : []);
      } catch (_e) {
        if (alive) setCitiesError("Could not load cities list");
      }
    }

    loadCities();
    return () => {
      alive = false;
    };
  }, []);

  // Load services (for sidebar filter)
  useEffect(() => {
    let alive = true;

    async function loadServices() {
      try {
        setServicesError("");
        const res = await fetch(`${API_BASE}/api/services`);
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();

        // your controller returns an array directly, but handle both formats:
        const list = Array.isArray(json) ? json : json?.data || [];

        if (alive) setServices(list);
      } catch (_e) {
        if (alive) setServicesError("Could not load services list");
      }
    }

    loadServices();
    return () => {
      alive = false;
    };
  }, []);

  const isCityValid = city.trim().length > 0;
  const isPickupValid = Boolean(pickupAt);
  const canSearch = isCityValid && isPickupValid;

  const countLabel = useMemo(() => {
    if (firstLoad || !submittedFilters) return "";
    return `${items.length} providers found`;
  }, [firstLoad, items.length, submittedFilters]);

  const onSearch = () => {
    setTouched({ city: true, pickupAt: true });
    if (!canSearch) return;

    const finalFilters = {
      ...advancedFilters,
      city: city.trim(),
      pickup_at: new Date(pickupAt).toISOString(), // backend expects ISO
    };

    setSubmittedFilters(finalFilters);
  };

  const onReset = () => {
    setCity("");
    setPickupAt("");
    setAdvancedFilters({});
    setSubmittedFilters(null);
    setTouched({ city: false, pickupAt: false });
    setItems([]);
    setNextCursor(null);
    setError(null);
    setFirstLoad(true);
  };

  async function load(reset) {
    if (!submittedFilters) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchWorkers(
        submittedFilters,
        reset ? null : nextCursor
      );

      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      setError(e.message || "Search failed");
      if (reset) setItems([]);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }

  useEffect(() => {
    if (!submittedFilters) return;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(submittedFilters)]);

  return (
    <div className="min-h-screen bg-[#EBF8FB] text-[13px]" dir="ltr">
      {/* Hero */}
      <div className="max-w-[1100px] mx-auto px-5 pt-6 pb-4">
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 text-center">
          Laundry Service Provider Search
        </h1>
        <p className="text-slate-600 text-center mt-2 text-sm">
          Choose a city and pickup time to see available providers.
        </p>
      </div>

      {/* Top REQUIRED filters */}
      <div className="max-w-[1100px] mx-auto px-5">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-100 p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            {/* City dropdown (required) */}
            <div className="md:col-span-5">
              <label className="text-xs text-slate-500">
                City <span className="text-red-600">*</span>
              </label>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  !isCityValid && touched.city
                    ? "border-red-400 ring-0"
                    : "border-slate-200"
                }`}
              >
                <option value="">Choose a city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {citiesError ? (
                <div className="text-xs text-red-600 mt-1">{citiesError}</div>
              ) : null}

              {!isCityValid && touched.city ? (
                <div className="text-xs text-red-600 mt-1">
                  City is required
                </div>
              ) : null}
            </div>

            {/* Pickup time (required) */}
            <div className="md:col-span-5">
              <label className="text-xs text-slate-500">
                Pickup time <span className="text-red-600">*</span>
              </label>

              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pickupAt: true }))}
                className={`w-full mt-1 px-3 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  !isPickupValid && touched.pickupAt
                    ? "border-red-400 ring-0"
                    : "border-slate-200"
                }`}
              />

              {!isPickupValid && touched.pickupAt ? (
                <div className="text-xs text-red-600 mt-1">
                  Pickup time is required
                </div>
              ) : null}
            </div>

            {/* Search button */}
            <div className="md:col-span-2">
              <button
                onClick={onSearch}
                className="w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end">
            <button
              onClick={onReset}
              className="text-sm px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Layout: sidebar + results */}
      <div className="max-w-[1100px] mx-auto px-5 pb-10 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Sidebar filters (service optional, multi-select should be here) */}
          <aside className="md:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Filters
                </div>
                <div className="text-xs text-slate-500">
                  {submittedFilters ? `${items.length} found` : ""}
                </div>
              </div>

              <div className="mt-3">
                {/* IMPORTANT:
                   This assumes your SearchFilters supports:
                   services, servicesError, value, onChange
                   (so it can do multi-service optional selection)
                */}
                <SearchFilters
                  services={services}
                  servicesError={servicesError}
                  value={advancedFilters}
                  onChange={setAdvancedFilters}
                />
              </div>

              <button
                onClick={onSearch}
                className="mt-4 w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm"
              >
                Apply filters
              </button>
            </div>
          </aside>

          {/* Results */}
          <main className="md:col-span-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Available Providers
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {!submittedFilters
                    ? "Select a city + pickup time, then click Search."
                    : firstLoad
                    ? "Loading results..."
                    : items.length > 0
                    ? `${items.length} providers found`
                    : "No results found"}
                </p>
              </div>
              <div className="text-sm text-slate-500">{countLabel}</div>
            </div>

            {/* show nothing before search */}
            {!submittedFilters ? null : (
              <>
                {error && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {items.map((worker) => (
  <WorkerCard
    key={worker.worker_id}
    worker={worker}
    selectedCity={city}   // ✅ IMPORTANT
  />
))}

                </div>

                <div className="py-8 flex justify-center">
                  {nextCursor ? (
                    <button
                      type="button"
                      onClick={() => load(false)}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-sm"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </button>
                  ) : (
                    !loading &&
                    !firstLoad && (
                      <div className="text-slate-500 text-sm">
                        No more results
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
