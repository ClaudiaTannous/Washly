"use client";

import { useEffect, useState } from "react";

export default function SearchFilters({
  services = [],
  servicesError = "",
  value = {},
  onChange,
}) {
  const [local, setLocal] = useState({
    service_codes: value.service_codes ?? [],
    is_professional: value.is_professional ?? "",
    pickup: value.pickup ?? "",
    delivery: value.delivery ?? "",
    minRating: value.minRating ?? "",
    maxPrice: value.maxPrice ?? "",
  });

  useEffect(() => {
    setLocal({
      service_codes: value.service_codes ?? [],
      is_professional: value.is_professional ?? "",
      pickup: value.pickup ?? "",
      delivery: value.delivery ?? "",
      minRating: value.minRating ?? "",
      maxPrice: value.maxPrice ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  function emit(nextLocal) {
    onChange?.({
      service_codes: nextLocal.service_codes?.length
        ? nextLocal.service_codes
        : undefined,

      is_professional:
        nextLocal.is_professional === ""
          ? undefined
          : nextLocal.is_professional === "true",
      pickup:
        nextLocal.pickup === "" ? undefined : nextLocal.pickup === "true",
      delivery:
        nextLocal.delivery === "" ? undefined : nextLocal.delivery === "true",
      minRating:
        nextLocal.minRating === "" ? undefined : Number(nextLocal.minRating),
      maxPrice:
        nextLocal.maxPrice === "" ? undefined : Number(nextLocal.maxPrice),
    });
  }

  function update(patch) {
    const next = { ...local, ...patch };
    setLocal(next);
    emit(next);
  }

  function toggleService(code) {
    const exists = local.service_codes.includes(code);
    const nextCodes = exists
      ? local.service_codes.filter((x) => x !== code)
      : [...local.service_codes, code];

    update({ service_codes: nextCodes });
  }

  function reset() {
    const next = {
      service_codes: [],
      is_professional: "",
      pickup: "",
      delivery: "",
      minRating: "",
      maxPrice: "",
    };
    setLocal(next);
    emit(next);
  }

  const label = "text-xs text-slate-500";
  const select =
    "w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400";
  const input =
    "w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={reset}
          className="text-sm px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          Reset
        </button>
      </div>

      {/* Optional multi service */}
      <div>
        <label className={label}>Services (optional)</label>

        {servicesError ? (
          <div className="text-sm text-red-600 mt-2">{servicesError}</div>
        ) : null}

        <div className="mt-2 space-y-2 max-h-44 overflow-auto pr-1">
          {services.map((s) => (
            <label
              key={s.service_code}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={local.service_codes.includes(s.service_code)}
                onChange={() => toggleService(s.service_code)}
              />
              <span>{s.display_name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>Provider type</label>
        <select
          className={select}
          value={local.is_professional}
          onChange={(e) => update({ is_professional: e.target.value })}
        >
          <option value="">Any</option>
          <option value="true">Professional</option>
          <option value="false">Private / Student</option>
        </select>
      </div>

      <div>
        <label className={label}>Pickup</label>
        <select
          className={select}
          value={local.pickup}
          onChange={(e) => update({ pickup: e.target.value })}
        >
          <option value="">Doesn&apos;t matter</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div>
        <label className={label}>Delivery</label>
        <select
          className={select}
          value={local.delivery}
          onChange={(e) => update({ delivery: e.target.value })}
        >
          <option value="">Doesn&apos;t matter</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Minimum rating</label>
          <input
            className={input}
            placeholder="e.g. 4"
            value={local.minRating}
            onChange={(e) => update({ minRating: e.target.value })}
          />
        </div>

        <div>
          <label className={label}>Maximum price</label>
          <input
            className={input}
            placeholder="₪"
            value={local.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
