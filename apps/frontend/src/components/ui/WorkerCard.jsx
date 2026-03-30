"use client";

import Link from "next/link";

export default function WorkerCard({
  worker,
  selectedCity = "",
  onOpenDetails,
}) {
  const workerId = worker?.worker_id ?? worker?.id ?? worker?.workerId;

  const workerName =
    worker?.user
      ? `${worker.user.first_name || ""} ${worker.user.last_name || ""}`.trim()
      : worker?.name || worker?.profile?.name || "Worker";

  const workerCity =
    worker?.user?.city_name ||
    worker?.city_name ||
    worker?.profile?.city ||
    worker?.city ||
    "";

  const rating = Number(worker?.rating?.avg || 0).toFixed(1);
  const reviews = worker?.rating?.count ?? 0;

  const bookHref =
    workerId && selectedCity
      ? `/book/${workerId}?city=${encodeURIComponent(selectedCity)}`
      : workerId
      ? `/book/${workerId}`
      : "#";

  const disabled = !workerId;

  const openDetails = () => {
    if (onOpenDetails) onOpenDetails(worker);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md transition"
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
          {(workerName?.[0] || "W").toUpperCase()}
        </div>

        <div className="flex-1">
          <div className="text-xl font-bold text-slate-900">{workerName}</div>
          <div className="text-sm text-slate-500">{workerCity || "—"}</div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 font-medium">
              ★ {rating}
            </span>
            <span>{reviews ? `${reviews} reviews` : "No reviews yet"}</span>
          </div>
        </div>

        <div
          className="shrink-0 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={openDetails}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            View details
          </button>

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