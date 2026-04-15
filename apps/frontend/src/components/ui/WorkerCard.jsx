"use client";

import Link from "next/link";

const AVATAR_COLORS = [
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
];

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function StarRating({ avg }) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-300" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function WorkerCard({ worker, rank, selectedCity = "", onOpenDetails }) {
  const workerId = worker?.worker_id ?? worker?.id ?? worker?.workerId;

  const workerName =
    worker?.user
      ? `${worker.user.first_name || ""} ${worker.user.last_name || ""}`.trim()
      : worker?.name || worker?.profile?.name || "Worker";

  const workerCity =
    worker?.user?.city_name || worker?.city_name || worker?.profile?.city || worker?.city || "";

  const workerStreet = worker?.profile?.street || worker?.user?.street_name || "";

  const rating = Number(worker?.rating?.avg || 0);
  const reviews = worker?.rating?.count ?? 0;

  const isOnline = worker?.is_online;
  const isProfessional = worker?.is_professional;
  const pickupAvailable = worker?.pickup_available;
  const deliveryAvailable = worker?.delivery_available;
  const maxItems = worker?.max_items_per_wash;
  const pricePerWash = worker?.price_per_wash;

  const services = worker?.services ?? [];
  const lowestPrice = services.length
    ? Math.min(...services.map((s) => s.base_price ?? pricePerWash ?? 0))
    : pricePerWash ?? null;

  const bookHref =
    workerId && selectedCity
      ? `/book/${workerId}?city=${encodeURIComponent(selectedCity)}`
      : workerId
      ? `/book/${workerId}`
      : "#";

  const disabled = !workerId || !isOnline;
  const color = getAvatarColor(workerName);

  return (
    <div
      className="bg-white border border-sky-100 rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all"
      onClick={() => onOpenDetails?.(worker)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetails?.(worker); } }}
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
    >
      {rank != null && (
        <div className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[11px] font-medium text-sky-700 flex-shrink-0">
          {rank}
        </div>
      )}

      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0 ${color.bg} ${color.text}`}>
        {(workerName?.[0] || "W").toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-slate-900">{workerName}</span>
          {isProfessional && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Professional
            </span>
          )}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400" : "bg-slate-300"}`} />
        </div>

        <div className="text-[12px] text-slate-500 mt-0.5">
          {[workerCity, workerStreet].filter(Boolean).join(" · ")}
          {maxItems ? ` · max ${maxItems} items/wash` : ""}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {pickupAvailable && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">Pickup</span>
          )}
          {deliveryAvailable && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Delivery</span>
          )}
          {services.slice(0, 3).map((s) => (
            <span key={s.service_code} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
              {s.name}
            </span>
          ))}
          {services.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
              +{services.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[80px]">
        <StarRating avg={rating} />
        <div className="text-[15px] font-medium text-slate-900">{rating.toFixed(1)}</div>
        <div className="text-[11px] text-slate-400">
          {reviews > 0 ? `${reviews} review${reviews !== 1 ? "s" : ""}` : "No reviews"}
        </div>
        {lowestPrice != null && (
          <div className="text-[11px] text-slate-500 mt-1">
            from <span className="text-slate-800 font-medium">₪{lowestPrice}</span>/wash
          </div>
        )}
      </div>

      <div
        className="flex flex-col gap-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenDetails?.(worker)}
          className="px-4 py-1.5 rounded-full border border-sky-200 bg-white text-sky-700 text-[12px] hover:bg-sky-50 transition"
        >
          View details
        </button>

        {disabled ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-400 text-[12px] cursor-not-allowed"
          >
            {!workerId ? "Unavailable" : "Offline"}
          </button>
        ) : (
          <Link
            href={bookHref}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-sky-600 text-white text-[12px] font-medium hover:bg-sky-700 transition"
          >
            Book now
          </Link>
        )}
      </div>
    </div>
  );
}
