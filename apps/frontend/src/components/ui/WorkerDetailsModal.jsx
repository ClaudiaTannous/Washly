"use client";

import { useEffect, useMemo } from "react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function WorkerDetailsModal({ open, onClose, worker }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose?.();
    }

    if (open) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  const rating = Number(worker?.rating?.avg || 0).toFixed(1);
  const reviews = worker?.rating?.count ?? 0;

  const name = worker?.profile?.name || "Worker";
  const description =
    worker?.profile?.description || "No description provided.";

  const address = [
    worker?.profile?.city,
    worker?.profile?.street,
    worker?.profile?.building_number
      ? `Building ${worker.profile.building_number}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const groupedHours = useMemo(() => {
    const list = Array.isArray(worker?.hours) ? worker.hours : [];

    return DAY_NAMES.map((dayName, dayIndex) => {
      const slots = list
        .filter((h) => Number(h.day_of_week) === dayIndex)
        .sort((a, b) => {
          if (a.start_hhmm < b.start_hhmm) return -1;
          if (a.start_hhmm > b.start_hhmm) return 1;
          return 0;
        });

      return { dayName, slots };
    });
  }, [worker]);

  if (!open || !worker) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
<div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">          {/* header */}
<div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">            <div className="flex items-center gap-4 min-w-0">
<div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">                {worker?.image_url ? (
                  <img
                    src={worker.image_url}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-600">
                    {(name?.[0] || "W").toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
<h2 className="text-xl font-bold text-slate-900 truncate">                  {name}
                </h2>
<div className="text-slate-500 mt-1 text-sm">
                    {worker?.is_online ? "Online" : "Offline"}
                  {worker?.is_professional
                    ? " • Professional"
                    : " • Private/Student"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
className="shrink-0 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"            >
              Close
            </button>
          </div>

          {/* body */}
<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">            {/* left */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Rating</div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-2xl bg-green-600 text-white text-sm font-semibold">
                    ★ {rating}
                  </span>
                  <span className="text-sm text-slate-600">
                    {reviews ? `${reviews} reviews` : "No reviews yet"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Location</div>
<div className="mt-1 text-sm text-slate-800">
                  {address || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Availability</div>
                <div className="mt-1 text-base text-slate-800">
                  {worker?.pickup_available ? "Pickup available" : "No pickup"}
                  {" • "}
                  {worker?.delivery_available
                    ? "Delivery available"
                    : "No delivery"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Contact</div>
<div className="mt-1 text-sm text-slate-800">
                  {worker?.profile?.phone || "—"}
                </div>
              </div>
            </div>

            {/* right */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">About</div>
                <div className="mt-1 text-base text-slate-900 leading-relaxed">
                  {description}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Services</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(worker?.services || []).length ? (
                    worker.services.map((s) => (
                      <div
                        key={s.service_code}
className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"                        title={s.notes || ""}
                      >
                        {s.name}
                        {s.base_price ? (
                          <span className="text-slate-500"> • ₪{s.base_price}</span>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-base text-slate-600">
                      No services listed.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-sm text-slate-500">Working hours</div>

                <div className="mt-3 space-y-2">
                  {groupedHours.some((d) => d.slots.length > 0) ? (
                    groupedHours.map(({ dayName, slots }) => (
                      <div
                        key={dayName}
                        className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-slate-700 min-w-[110px]">
                          {dayName}
                        </div>

                        <div className="text-sm text-slate-900 text-right flex-1">
                          {slots.length > 0 ? (
                            slots.map((slot, idx) => (
                              <div key={`${dayName}-${idx}`}>
                                {slot.start_hhmm} - {slot.end_hhmm}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400">Closed</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">
                      No working hours available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}