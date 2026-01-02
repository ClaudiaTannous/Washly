"use client";

import { useEffect, useMemo, useState } from "react";
import { RatingSection } from "@/components/RatingSection";
import Link from "next/link";


function StarRow({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${
            s <= rounded ? "text-yellow-500" : "text-slate-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function buildStatsFromRatings(ratings) {
  const total = ratings.length;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of ratings) {
    const score = Number(r.rating) || 0;
    if (score >= 1 && score <= 5) distribution[score] += 1;
    sum += score;
  }

  return {
    average: total ? sum / total : 0,
    total,
    distribution,
  };
}

export default function WorkerCard({ worker }) {
  const [open, setOpen] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsErr, setReviewsErr] = useState("");

  const avg = Number(worker?.rating?.avg ?? 0);
  const count = Number(worker?.rating?.count ?? 0);

  const stats = useMemo(() => buildStatsFromRatings(reviews), [reviews]);

  // Fetch reviews only when modal opens
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoadingReviews(true);
        setReviewsErr("");

        const res = await fetch(
          `http://localhost:5000/api/ratings/worker/${worker.worker_id}`,
          { credentials: "include", signal: controller.signal }
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const data = await res.json();

        // backend returns: [{ id, score, comment, created_at, Rater{...}, ... }]
        const mapped = (Array.isArray(data) ? data : []).map((r) => ({
          id: String(r.id),
          rating: Number(r.score),
          date: r.created_at,
          comment: r.comment || "",
          customer_name: r.Rater
            ? `${r.Rater.first_name} ${r.Rater.last_name}`
            : "Customer",
          customer_avatar: null,
          service_type: null,
          helpful_count: 0,
        }));

        setReviews(mapped);
      } catch (e) {
        if (e.name !== "AbortError") {
          setReviewsErr("Could not load reviews");
          setReviews([]);
        }
      } finally {
        setLoadingReviews(false);
      }
    }

    load();
    return () => controller.abort();
  }, [open, worker.worker_id]);

  const name = worker?.profile?.name ?? "Worker";
  const city = worker?.profile?.city ?? "";
  const street = worker?.profile?.street ?? "";
  const building = worker?.profile?.building_number ?? "";
  const address = [street, city].filter(Boolean).join(", ") + (building ? `, ${building}` : "");

  const serviceChips = (worker?.services ?? []).slice(0, 3);
  const extraServices = Math.max(0, (worker?.services?.length ?? 0) - serviceChips.length);

  const priceText = (() => {
    const prices = (worker?.services ?? [])
      .map((s) => (s.base_price ? Number(s.base_price) : null))
      .filter((x) => typeof x === "number" && !Number.isNaN(x));

    if (!prices.length) return "Price varies";
    const min = Math.min(...prices);
    return `From ₪${min}`;
  })();

  return (
    <>
      {/* CARD */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 cursor-pointer"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
              {worker?.image_url ? (
                <img
                  src={worker.image_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 font-semibold">
                  {name?.[0]?.toUpperCase() ?? "W"}
                </span>
              )}
            </div>

            <div>
              <div className="font-semibold text-slate-900 text-lg">{name}</div>
              <div className="text-slate-500 text-sm">Laundry specialist</div>

              <div className="mt-2 flex gap-2 flex-wrap">
                {worker?.is_online ? (
                  <span className="px-3 py-1 rounded-full text-xs border border-green-200 text-green-700 bg-green-50">
                    Online
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs border border-slate-200 text-slate-600 bg-slate-50">
                    Offline
                  </span>
                )}

                <span className="px-3 py-1 rounded-full text-xs border border-slate-200 text-slate-700 bg-slate-50">
                  {worker?.is_professional ? "Professional" : "Private / Student"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold">
              ★ {count ? avg.toFixed(1) : "0.0"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {count ? `${count} reviews` : "No reviews"}
            </div>
          </div>
        </div>

        <div className="mt-4 text-slate-600 text-sm flex items-center gap-2">
          <span>📍</span>
          <span className="truncate">{address}</span>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          {serviceChips.map((s) => (
            <span
              key={s.service_code}
              className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-700"
            >
              {s.name}
            </span>
          ))}
          {extraServices > 0 && (
            <span className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-700">
              +{extraServices}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">{priceText}</div>
            <div className="text-slate-500 text-sm">
              {worker?.is_online ? "Online" : "Offline"}
              {" • "}
              {worker?.pickup_available ? "Pickup" : "No pickup"}
              {" • "}
              {worker?.delivery_available ? "Delivery" : "No delivery"}
            </div>
          </div>

         <Link
  href={`/book/${worker.worker_id}`}
  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center justify-center"
  onClick={(e) => e.stopPropagation()}
>
  Book Now
</Link>

        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-slate-900">{name}</div>
                <div className="text-slate-500 text-sm">{address}</div>

                <div className="mt-2 flex items-center gap-3">
                  <StarRow value={avg} />
                  <span className="text-sm text-slate-600">
                    {count ? `${avg.toFixed(1)} • ${count} reviews` : "No reviews yet"}
                  </span>
                </div>
              </div>

              <button
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[70vh] overflow-auto">
              {/* Worker details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="font-semibold text-slate-800 mb-2">About</div>
                  <div className="text-slate-600 text-sm whitespace-pre-wrap">
                    {worker?.profile?.description || "No description"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="font-semibold text-slate-800 mb-2">Services</div>
                  <div className="flex flex-wrap gap-2">
                    {(worker?.services ?? []).map((s) => (
                      <span
                        key={s.service_code}
                        className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {s.name}
                        {s.base_price ? ` • ₪${s.base_price}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              {loadingReviews ? (
                <div className="text-slate-600">Loading reviews...</div>
              ) : reviewsErr ? (
                <div className="text-red-600">{reviewsErr}</div>
              ) : (
                <RatingSection stats={stats} reviews={reviews} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
