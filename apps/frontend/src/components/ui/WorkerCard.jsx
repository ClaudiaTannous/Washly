"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function WorkerCard({ worker }) {
  const searchParams = useSearchParams();

  // read city from search page URL if it exists
  const queryCity = useMemo(() => {
    const c =
      (searchParams?.get("city") ||
        searchParams?.get("pickupCity") ||
        searchParams?.get("pickup") ||
        "") + "";
    return c.trim();
  }, [searchParams]);

  const workerId = worker?.worker_id ?? worker?.id ?? worker?.workerId;

  const workerName =
    worker?.user
      ? `${worker.user.first_name || ""} ${worker.user.last_name || ""}`.trim()
      : worker?.name || worker?.profile?.name || "Worker";

  const workerCity =
    worker?.city_name ||
    worker?.user?.city_name ||
    worker?.profile?.city ||
    worker?.city ||
    "";

  const bookHref =
    workerId && queryCity
      ? `/book/${workerId}?city=${encodeURIComponent(queryCity)}`
      : workerId
        ? `/book/${workerId}`
        : "#";

  // ⚠️ If workerId missing, don't crash UI
  const disabled = !workerId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
          {(workerName?.[0] || "W").toUpperCase()}
        </div>

        <div className="flex-1">
          <div className="text-xl font-bold text-slate-900">{workerName}</div>
          <div className="text-sm text-slate-500">
            {workerCity ? workerCity : "—"}
          </div>
        </div>

        <div className="shrink-0">
          {disabled ? (
            <button
              className="px-5 py-2 rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed"
              disabled
            >
              Book Now
            </button>
          ) : (
            <Link
              href={bookHref}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
