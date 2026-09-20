"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkerAvatar from "@/components/WorkerAvatar";

import { Package, Clock, MapPin, Star, User, ArrowLeft } from "lucide-react";

import {
  getWorker,
  getWorkerRatings,
  getWorkerServices,
  getWorkerBusinessHours,
} from "@/lib/apiClient";

import { RatingSection } from "@/components/RatingSection";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getWorkerName(worker) {
  if (!worker) return "Worker";

  if (worker.user) {
    const name = `${worker.user.first_name || ""} ${
      worker.user.last_name || ""
    }`.trim();

    return name || "Worker";
  }

  return worker.profile?.name || worker.name || "Worker";
}

function getWorkerCity(worker) {
  return (
    worker?.user?.city_name ||
    worker?.profile?.city ||
    worker?.city_name ||
    worker?.city ||
    ""
  );
}

function getWorkerStreet(worker) {
  return (
    worker?.user?.street_name ||
    worker?.profile?.street ||
    worker?.street_name ||
    ""
  );
}

function WorkerGuestProfilePageInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const workerId = params.workerId;
  const selectedCity = searchParams.get("city") || "";

  const [worker, setWorker] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWorkerData() {
      try {
        setLoading(true);
        setError("");

        const workerData = await getWorker(workerId);

        const ratingsResponse = await getWorkerRatings(workerId).catch(
          () => [],
        );

        const ratings = Array.isArray(ratingsResponse)
          ? ratingsResponse
          : (ratingsResponse.ratings ?? ratingsResponse.data ?? []);

        const workerServices = await getWorkerServices(workerId).catch(
          () => [],
        );

        const hours = await getWorkerBusinessHours(workerId).catch(() => []);

        if (cancelled) return;

        const total = ratings.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        ratings.forEach((r) => {
          const score = Number(r.score);

          if (score >= 1 && score <= 5) {
            distribution[score]++;
          }
        });

        const average =
          total === 0
            ? 0
            : ratings.reduce((sum, r) => sum + Number(r.score || 0), 0) / total;

        setRatingStats({
          average,
          total,
          distribution,
        });

        setReviews(
          ratings.map((r) => ({
            id: r.id,
            customer_name: r.Rater
              ? `${r.Rater.first_name} ${r.Rater.last_name}`
              : "Customer",
            rating: r.score,
            comment: r.comment || "No comment",
            date: r.created_at,

            photos: (r.Photos || []).map((photo) => ({
              id: photo.id,
              image_url: photo.full_image_url
                ? photo.full_image_url
                : photo.image_url?.startsWith("http")
                  ? photo.image_url
                  : `${BACKEND_URL}${photo.image_url}`,
            })),
          })),
        );

        setWorker(workerData);
        setServices(Array.isArray(workerServices) ? workerServices : []);
        setBusinessHours(Array.isArray(hours) ? hours : []);
      } catch (err) {
        console.error("LOAD PUBLIC WORKER ERROR:", err);

        if (!cancelled) {
          setError(err.message || "Could not load worker profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (workerId) {
      loadWorkerData();
    }

    return () => {
      cancelled = true;
    };
  }, [workerId]);

  if (loading) {
    return (
      <div
        dir="ltr"
        className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/70 animate-pulse" />

              <div>
                <div className="h-6 w-48 rounded-full bg-white/80 animate-pulse mb-3" />
                <div className="h-4 w-64 rounded-full bg-white/70 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-32 rounded-xl bg-white/70 animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-white/70 animate-pulse" />
            </div>
          </div>

          <div className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 mb-10 animate-pulse">
            <div className="h-6 w-40 rounded-full bg-slate-100 mb-4" />
            <div className="h-4 w-full rounded-full bg-slate-100 mb-3" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          </div>

          <div className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div
        dir="ltr"
        className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white flex items-center justify-center px-4"
      >
        <Card className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-slate-800 mb-3">
            Could not load worker
          </h1>

          <p className="text-red-600 mb-6">
            {error || "Worker was not found."}
          </p>

          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl"
          >
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  const workerName = getWorkerName(worker);
  const workerCity = getWorkerCity(worker);
  const workerStreet = getWorkerStreet(worker);

  const bookHref = selectedCity
    ? `/book/${workerId}?city=${encodeURIComponent(selectedCity)}`
    : `/book/${workerId}`;

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          {/* LEFT SIDE: worker info */}
          <div className="flex items-center gap-4">
            <WorkerAvatar workerName={workerName} imageUrl={worker.image_url} />

            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                {workerName}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {[workerCity, workerStreet].filter(Boolean).join(" · ") ||
                  "Worker profile"}
              </p>

              <p className="text-sm mt-1 flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    worker.is_online ? "bg-green-400" : "bg-slate-300"
                  }`}
                />

                <span className="text-slate-600">
                  {worker.is_online ? "Online" : "Offline"}
                </span>

                {worker.is_professional && (
                  <span className="text-cyan-700 font-medium">
                    Professional
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl border-slate-200 bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to search
            </Button>
            <Button
              onClick={() => router.push(bookHref)}
              disabled={!worker.is_online}
              className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-xl shadow-lg hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {worker.is_online ? "Book service" : "Worker is offline"}
            </Button>
          </div>
        </div>

        {/* WORKER DESCRIPTION */}
        <Card className="bg-white rounded-2xl shadow-md border border-slate-100 mb-10">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>

              <h2 className="text-xl font-semibold text-slate-800">About Me</h2>
            </div>

            {worker.description || worker.user?.description ? (
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {worker.description || worker.user?.description}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No description provided yet.
              </p>
            )}
          </div>
        </Card>

        {/* PROFILE SUMMARY */}
        <Card className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] text-white rounded-2xl mb-10 shadow-md">
          <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
            <Summary
              label="Customer Rating"
              value={ratingStats?.average.toFixed(1) ?? "0.0"}
              icon={Star}
            />

            <Summary
              label="Customer Reviews"
              value={ratingStats?.total ?? 0}
              icon={User}
            />

            <Summary
              label="Price per wash"
              value={`₪${worker.price_per_wash ?? 0}`}
            />

            <Summary
              label="Max orders/day"
              value={worker.max_orders_per_day ?? 0}
            />

            <Summary
              label="Min notice"
              value={`${worker.min_notice_minutes ?? 0} min`}
              icon={Clock}
            />
          </div>
        </Card>

        {/* GUEST INFO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Stat
            label="Pickup"
            value={worker.pickup_available ? "Available" : "No"}
            icon={MapPin}
            color="blue"
          />

          <Stat
            label="Delivery"
            value={worker.delivery_available ? "Available" : "No"}
            icon={Package}
            color="cyan"
          />

          <Stat
            label="Max items"
            value={worker.max_items_per_wash ?? "—"}
            icon={Package}
            color="green"
          />

          <Stat
            label="Status"
            value={worker.is_online ? "Online" : "Offline"}
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* BUSINESS HOURS + SERVICES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 mb-10">
          {/* BUSINESS HOURS */}
          <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  Business Hours
                </h2>
              </div>

              {businessHours.length === 0 ? (
                <p className="text-sm text-slate-500">No hours defined</p>
              ) : (
                <div className="space-y-3">
                  {businessHours.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-slate-700 font-medium">
                        {DAY_NAMES[h.day_of_week]}
                      </span>

                      <span className="text-slate-600">
                        {h.start_hhmm} – {h.end_hhmm}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* SERVICES OFFERED */}
          <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  Services Offered
                </h2>
              </div>

              {services.length === 0 ? (
                <p className="text-sm text-slate-500">No services configured</p>
              ) : (
                <div className="space-y-4">
                  {services.map((s) => (
                    <div
                      key={s.service_code}
                      className="p-4 bg-gradient-to-r from-[#e0f7fa] to-white rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-slate-800">
                        {s.Service?.display_name || s.name || s.service_code}
                      </div>

                      {s.Service?.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {s.Service.description}
                        </p>
                      )}

                      {s.base_price != null && (
                        <p className="text-sm text-slate-700 mt-2">
                          Price: ₪{s.base_price}
                        </p>
                      )}

                      {s.notes && (
                        <p className="text-sm text-slate-500 mt-1">{s.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RATINGS */}
        {ratingStats && (
          <div className="mt-16 pt-10 border-t border-slate-200">
            <RatingSection stats={ratingStats} reviews={reviews} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerGuestProfilePage() {
  return (
    <Suspense fallback={null}>
      <WorkerGuestProfilePageInner />
    </Suspense>
  );
}

/* ---------------- HELPERS ---------------- */
function Stat({ label, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    cyan: "bg-cyan-100 text-cyan-600",
  };

  return (
    <Card className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm">{label}</p>
          <h2 className="text-2xl font-semibold text-slate-800">{value}</h2>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

function Summary({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-5 h-5" />}
        <h3 className="text-lg font-semibold">{value}</h3>
      </div>

      <p className="text-white/90">{label}</p>
    </div>
  );
}
