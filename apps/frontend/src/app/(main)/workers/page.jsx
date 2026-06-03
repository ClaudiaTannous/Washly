"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchFilters from "@/components/ui/SearchFilters";
import WorkerCard from "@/components/ui/WorkerCard";
import ModernDateTimePicker from "@/components/ui/ModernDateTimePicker";
import { searchWorkers } from "@/lib/apiClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function fetchWorkers(filters, cursor) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "service_codes" && Array.isArray(value)) {
      if (value.length) params.set("service_codes", value.join(","));
      return;
    }
    params.set(key, String(value));
  });
  if (cursor) params.set("cursor", cursor);
  if (!params.has("limit")) params.set("limit", "50");

  const json = await searchWorkers(params.toString());

  if (!json?.ok) {
    throw new Error(json?.error || "Search failed");
  }

  return json.data;
}

function toDateTimeLocal(isoString) {
  const d = new Date(isoString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function buildAlternativePickupTimes(originalPickupAt) {
  if (!originalPickupAt) return [];
  const base = new Date(originalPickupAt);
  const plus2 = new Date(base);
  plus2.setHours(plus2.getHours() + 2);
  const plus4 = new Date(base);
  plus4.setHours(plus4.getHours() + 4);
  const nextMorning = new Date(base);
  nextMorning.setDate(nextMorning.getDate() + 1);
  nextMorning.setHours(9, 0, 0, 0);
  const nextEvening = new Date(base);
  nextEvening.setDate(nextEvening.getDate() + 1);
  nextEvening.setHours(17, 0, 0, 0);
  return [
    { label: "2 hours later", pickup_at: plus2.toISOString() },
    { label: "4 hours later", pickup_at: plus4.toISOString() },
    { label: "Tomorrow morning", pickup_at: nextMorning.toISOString() },
    { label: "Tomorrow evening", pickup_at: nextEvening.toISOString() },
  ];
}

export default function WorkersSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const cityMenuRef = useRef(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [city, setCity] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentWorkerId, setCurrentWorkerId] = useState(null);

  const [submittedFilters, setSubmittedFilters] = useState({});
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState(null);

  const [sameCityWorkers, setSameCityWorkers] = useState([]);
  const [alternativeTimeMatches, setAlternativeTimeMatches] = useState([]);
  const [noWorkersInCity, setNoWorkersInCity] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (cityMenuRef.current && !cityMenuRef.current.contains(event.target)) {
        setCityMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const cityFromUrl = searchParams.get("city") || "";
    const pickupAtFromUrl = searchParams.get("pickup_at") || "";

    if (!cityFromUrl) return;

    setCity(cityFromUrl);

    if (pickupAtFromUrl) {
      setPickupAt(toDateTimeLocal(pickupAtFromUrl));
    }

    const nextAdvancedFilters = {};

    searchParams.forEach((value, key) => {
      if (key === "city" || key === "pickup_at") return;

      if (key === "service_codes") {
        nextAdvancedFilters.service_codes = value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        return;
      }

      nextAdvancedFilters[key] = value;
    });

    setAdvancedFilters(nextAdvancedFilters);

    const filters = {
      ...nextAdvancedFilters,
      city: cityFromUrl,
    };

    if (pickupAtFromUrl) {
      filters.pickup_at = pickupAtFromUrl;
    }

    setSubmittedFilters(filters);
    setFirstLoad(true);
  }, [searchParamsString]);

  // Load logged-in user's city as default
  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const user = await res.json();
        setCurrentUser(user);
        if (user?.WorkerProfile?.id) {
          setCurrentWorkerId(user.WorkerProfile.id);
        }

        if (user?.worker?.id) {
          setCurrentWorkerId(user.worker.id);
        }

        if (user?.worker_id) {
          setCurrentWorkerId(user.worker_id);
        }
        if (user?.city_name) setCity(user.city_name);
      } catch (_) {}
    }
    loadCurrentUser();
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/search/cities`)
      .then((r) => r.json())
      .then((json) => {
        if (alive && json?.ok)
          setCities(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => {
        if (alive) setCitiesError("Could not load cities");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/services`)
      .then((r) => r.json())
      .then((json) => {
        if (alive) setServices(Array.isArray(json) ? json : json?.data || []);
      })
      .catch(() => {
        if (alive) setServicesError("Could not load services");
      });
    return () => {
      alive = false;
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items]
      .filter((worker) => {
        if (!currentWorkerId) return true;
        return String(worker.worker_id) !== String(currentWorkerId);
      })
      .sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
    console.log("currentUser:", currentUser);
    console.log("currentWorkerId:", currentWorkerId);
    console.log("workers:", items);
  }, [items, currentWorkerId]);

  const isCityValid = city.trim().length > 0;

  function buildFilters() {
    const f = { ...advancedFilters, city: city.trim() };
    if (pickupAt) f.pickup_at = new Date(pickupAt).toISOString();
    return f;
  }

  useEffect(() => {
    if (!city.trim()) {
      setSubmittedFilters({});
      setItems([]);
      setNextCursor(null);
      setError(null);
      setFirstLoad(true);
      setNoWorkersInCity(false);
      setSameCityWorkers([]);
      setAlternativeTimeMatches([]);
      return;
    }

    const cityFromUrl = searchParams.get("city");

    if (cityFromUrl) return;

    setItems([]);
    setNextCursor(null);
    setError(null);
    setFirstLoad(true);
    setNoWorkersInCity(false);
    setSameCityWorkers([]);
    setAlternativeTimeMatches([]);

    setSubmittedFilters({ city: city.trim() });
  }, [city, searchParams]);

  const onSearch = () => {
    if (!isCityValid) {
      setShowCityModal(true);
      return;
    }

    const filters = buildFilters();
    setSubmittedFilters(filters);
    setFiltersOpen(false);

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (key === "service_codes" && Array.isArray(value)) {
        if (value.length) params.set("service_codes", value.join(","));
        return;
      }

      params.set(key, String(value));
    });

    router.replace(`/workers?${params.toString()}`);
  };

  const onReset = () => {
    setPickupAt("");
    setAdvancedFilters({});

    if (city.trim()) {
      const filters = { city: city.trim() };
      setSubmittedFilters(filters);
      router.replace(`/workers?city=${encodeURIComponent(city.trim())}`);
    }
  };

  async function fetchAlternativeTimeMatches(filters) {
    if (!filters?.pickup_at) return [];
    const candidates = buildAlternativePickupTimes(filters.pickup_at);
    const matches = [];
    for (const c of candidates) {
      const data = await fetchWorkers({ ...filters, pickup_at: c.pickup_at });
      if (data.items?.length > 0)
        matches.push({
          label: c.label,
          pickup_at: c.pickup_at,
          count: data.items.length,
        });
    }
    return matches;
  }

  function applyAlternativeTime(isoString) {
    setPickupAt(toDateTimeLocal(isoString));
    setSubmittedFilters({ ...submittedFilters, pickup_at: isoString });
  }

  const load = useCallback(
    async (reset) => {
      if (!submittedFilters) return;
      try {
        setLoading(true);
        setError(null);

        if (reset) {
          setFirstLoad(true);
          setItems([]);
          setNextCursor(null);
          setNoWorkersInCity(false);
          setSameCityWorkers([]);
          setAlternativeTimeMatches([]);
        }
        const data = await fetchWorkers(
          submittedFilters,
          reset ? null : nextCursor,
        );
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setNextCursor(data.nextCursor ?? null);

        if (reset && data.items.length === 0 && submittedFilters?.city) {
          // Check if ANY workers exist in this city (no filters, no time)
          const cityOnlyData = await fetchWorkers({
            city: submittedFilters.city,
          });
          const anyInCity = (cityOnlyData.items || []).length > 0;

          if (!anyInCity) {
            // Case 2: no workers in this city at all
            setNoWorkersInCity(true);
            setSameCityWorkers([]);
            setAlternativeTimeMatches([]);
          } else {
            setNoWorkersInCity(false);
            const relaxed = { ...submittedFilters };
            delete relaxed.pickup_at;
            const relaxedData = await fetchWorkers(relaxed);
            setSameCityWorkers(
              (relaxedData.items || []).filter((worker) => {
                if (!currentUser?.id) return true;

                const workerUserId =
                  worker.user_id ||
                  worker.userId ||
                  worker.user?.id ||
                  worker.User?.id;

                return String(workerUserId) !== String(currentUser.id);
              }),
            );
            if (submittedFilters.pickup_at) {
              setAlternativeTimeMatches(
                await fetchAlternativeTimeMatches(submittedFilters),
              );
            } else {
              setAlternativeTimeMatches([]);
            }
          }
        } else if (reset) {
          setNoWorkersInCity(false);
          setSameCityWorkers([]);
          setAlternativeTimeMatches([]);
        }
      } catch (e) {
        setError(e.message || "Search failed");
        if (reset) setItems([]);
      } finally {
        setLoading(false);
        setFirstLoad(false);
      }
    },
    [submittedFilters, nextCursor],
  );

  useEffect(() => {
    if (!submittedFilters) return;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(submittedFilters)]);

  return (
    <div className="min-h-screen bg-[#EBF8FB] text-[13px]" dir="ltr">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-14">
        {/* ── Top search bar ── */}
        <div className="bg-white/90 backdrop-blur border border-sky-100 rounded-[28px] px-5 py-4 mb-7 flex items-center gap-3 flex-wrap shadow-sm">
          {/* City custom dropdown */}
          <div
            ref={cityMenuRef}
            className="relative flex-shrink-0 min-w-[240px]"
          >
            <button
              type="button"
              onClick={() => setCityMenuOpen((open) => !open)}
              className="w-full flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2.5 text-sky-800 shadow-sm hover:bg-sky-100 transition"
            >
              <svg
                className="w-4 h-4 text-sky-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>

              <span className="font-bold text-sm truncate">
                {city || "Choose city"}
              </span>

              <svg
                className={`ml-auto w-4 h-4 text-sky-500 transition-transform ${
                  cityMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {cityMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
                <div className="max-h-64 overflow-y-auto p-2">
                  {cities.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      No cities found
                    </div>
                  ) : (
                    cities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const filters = { city: c };

                          setCity(c);
                          setSubmittedFilters(filters);
                          setItems([]);
                          setNextCursor(null);
                          setError(null);
                          setFirstLoad(true);
                          setNoWorkersInCity(false);
                          setSameCityWorkers([]);
                          setAlternativeTimeMatches([]);

                          router.replace(
                            `/workers?city=${encodeURIComponent(c)}`,
                          );
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${
                          city === c
                            ? "bg-sky-100 text-sky-800 font-semibold"
                            : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                        }`}
                      >
                        {c}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ModernDateTimePicker value={pickupAt} onChange={setPickupAt} />

          {/* Filters toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition shadow-sm ${
              filtersOpen
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-sky-700 border-sky-200 hover:bg-sky-50"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
          </button>

          <button
            type="button"
            onClick={onSearch}
            disabled={!isCityValid || loading}
            className="px-7 py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {filtersOpen && (
          <div className="bg-white/95 border border-sky-100 rounded-[28px] px-6 py-5 mb-6 shadow-sm">
            <SearchFilters
              services={services}
              servicesError={servicesError}
              value={advancedFilters}
              onChange={setAdvancedFilters}
            />
            <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-sky-50">
              <button
                type="button"
                onClick={onReset}
                className="px-5 py-2 rounded-full border border-slate-200 text-sm text-slate-500 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onSearch}
                className="px-6 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm mb-5">
            {error}
          </div>
        )}

        {sortedItems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sortedItems.map((worker, i) => (
              <WorkerCard
                key={worker.worker_id}
                worker={worker}
                rank={i + 1}
                selectedCity={city}
                showServicePrices={true}
                onOpenDetails={(w) => {
                  const params = new URLSearchParams();

                  Object.entries(submittedFilters || {}).forEach(
                    ([key, value]) => {
                      if (value === undefined || value === null || value === "")
                        return;

                      if (key === "service_codes" && Array.isArray(value)) {
                        if (value.length > 0) {
                          params.set("service_codes", value.join(","));
                        }
                        return;
                      }

                      params.set(key, String(value));
                    },
                  );

                  router.push(
                    params.toString()
                      ? `/workers/${w.worker_id}?${params.toString()}`
                      : `/workers/${w.worker_id}`,
                  );
                }}
              />
            ))}
          </div>
        ) : (
          !firstLoad && (
            <div className="space-y-6 mt-2">
              {/* Case 2: no workers in this city at all */}
              {noWorkersInCity && (
                <div className="bg-white/95 border border-sky-100 rounded-[28px] px-6 py-10 text-center shadow-sm">
                  <div className="text-3xl mb-3">📍</div>
                  <div className="text-lg font-semibold text-slate-800 mb-2">
                    No providers in {city} yet
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Try searching in a nearby city.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {cities
                      .filter((c) => c !== city)
                      .slice(0, 5)
                      .map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCity(c)}
                          className="px-4 py-2 rounded-full border border-sky-200 bg-sky-50 text-sky-700 text-sm hover:bg-sky-100 transition"
                        >
                          {c}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Case 3: workers exist but filters are too strict */}
              {!noWorkersInCity &&
                sameCityWorkers.length === 0 &&
                alternativeTimeMatches.length === 0 && (
                  <div className="bg-white/95 border border-sky-100 rounded-[28px] px-6 py-10 text-center shadow-sm">
                    <div className="text-3xl mb-3">🔍</div>
                    <div className="text-lg font-semibold text-slate-800 mb-2">
                      No matching providers
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                      Try changing the filters.
                    </p>
                    <button
                      type="button"
                      onClick={onReset}
                      className="px-6 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition"
                    >
                      Clear filters
                    </button>
                  </div>
                )}

              {/* Case 1: timing doesn't match — alternative times */}
              {alternativeTimeMatches.length > 0 && (
                <div className="bg-white/95 border border-sky-100 rounded-[28px] px-6 py-5 shadow-sm">
                  <div className="text-base font-semibold text-slate-800 mb-2">
                    Try another time
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alternativeTimeMatches.map((option) => (
                      <button
                        key={option.pickup_at}
                        type="button"
                        onClick={() => applyAlternativeTime(option.pickup_at)}
                        className="px-4 py-2 rounded-full bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sm text-sky-700 transition"
                      >
                        {option.label} · {option.count} available
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 1 continued: workers in city but not at selected time */}
              {sameCityWorkers.length > 0 && (
                <div>
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-slate-900">
                      Other providers in {city}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      These providers are nearby, but not at your selected time
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[...sameCityWorkers]
                      .sort(
                        (a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0),
                      )
                      .slice(0, 4)
                      .map((worker, i) => (
                        <WorkerCard
                          key={worker.worker_id}
                          worker={worker}
                          rank={i + 1}
                          selectedCity={city}
                          onOpenDetails={(w) => {
                            const params = new URLSearchParams();

                            params.set("city", city);

                            if (pickupAt) {
                              params.set(
                                "pickup_at",
                                new Date(pickupAt).toISOString(),
                              );
                            }

                            Object.entries(advancedFilters || {}).forEach(
                              ([key, value]) => {
                                if (
                                  value === undefined ||
                                  value === null ||
                                  value === ""
                                )
                                  return;

                                if (
                                  key === "service_codes" &&
                                  Array.isArray(value)
                                ) {
                                  if (value.length > 0) {
                                    params.set(
                                      "service_codes",
                                      value.join(","),
                                    );
                                  }
                                  return;
                                }

                                params.set(key, String(value));
                              },
                            );

                            router.push(
                              `/workers/${w.worker_id}?${params.toString()}`,
                            );
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
        {showCityModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21s-7-7.75-7-13a7 7 0 1114 0c0 5.25-7 13-7 13z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                Choose a City
              </h3>

              <p className="text-center text-slate-600 mb-6">
                Please choose a city before applying filters.
              </p>

              <button
                type="button"
                onClick={() => setShowCityModal(false)}
                className="w-full py-3 rounded-2xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
