"use client";

import { useEffect } from "react";

export default function WorkerDetailsModal({ open, onClose, worker }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !worker) return null;

  const rating = Number(worker.rating?.avg || 0).toFixed(1);
  const reviews = worker.rating?.count ?? 0;

  const name = worker.profile?.name || "Worker";
  const description = worker.profile?.description || "No description provided.";
  const address = [
    worker.profile?.city,
    worker.profile?.street,
    worker.profile?.building_number ? `Building ${worker.profile.building_number}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={worker.image_url || "/avatar-placeholder.png"}
                alt={name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <div className="text-base font-semibold text-slate-900">{name}</div>
                <div className="text-xs text-slate-500">
                  {worker.is_online ? "Online" : "Offline"}
                  {worker.is_professional ? " • Professional" : " • Private/Student"}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
            >
              Close
            </button>
          </div>

          {/* body */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* left */}
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Rating</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-green-600 text-white text-xs font-semibold">
                    ★ {rating}
                  </span>
                  <span className="text-xs text-slate-600">
                    {reviews ? `${reviews} reviews` : "No reviews yet"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Location</div>
                <div className="mt-1 text-sm text-slate-900">
                  {address || "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Availability</div>
                <div className="mt-1 text-sm text-slate-900">
                  {worker.pickup_available ? "Pickup available" : "No pickup"}
                  {" • "}
                  {worker.delivery_available ? "Delivery available" : "No delivery"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Contact</div>
                <div className="mt-1 text-sm text-slate-900">
                  {worker.profile?.phone || "—"}
                </div>
              </div>
            </div>

            {/* right */}
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">About</div>
                <div className="mt-1 text-sm text-slate-900 leading-relaxed">
                  {description}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Services</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(worker.services || []).length ? (
                    worker.services.map((s) => (
                      <div
                        key={s.service_code}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                        title={s.notes || ""}
                      >
                        {s.name}
                        {s.base_price ? (
                          <span className="text-slate-500"> • ₪{s.base_price}</span>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">No services listed.</div>
                  )}
                </div>
              </div>

              {/* optional: show notes if you want */}
              {/* You can add business hours later if you have an endpoint for it */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
