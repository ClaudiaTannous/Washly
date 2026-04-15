"use client";

export default function SearchFilters({ services = [], servicesError = "", value = {}, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  const toggleService = (code) => {
    const current = value.service_codes || [];
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    set("service_codes", next);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Services</div>
        {servicesError ? (
          <p className="text-xs text-red-500">{servicesError}</p>
        ) : services.length === 0 ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : (
          <div className="space-y-2">
            {services.map((svc) => {
              const code = svc.service_code ?? svc.code ?? svc.id;
              const label = svc.display_name ?? svc.name ?? code;
              const checked = (value.service_codes || []).includes(code);
              return (
                <label key={code} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleService(code)}
                    className="w-4 h-4 accent-sky-600 rounded"
                  />
                  <span className="text-[13px] text-slate-700">{label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wide text-slate-400 block mb-1">Provider type</label>
        <select
          value={value.is_professional ?? ""}
          onChange={(e) => set("is_professional", e.target.value === "" ? undefined : e.target.value)}
          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-[13px] bg-sky-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">Any</option>
          <option value="true">Professional</option>
          <option value="false">Individual</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wide text-slate-400 block mb-1">Pickup</label>
        <select
          value={value.pickup ?? ""}
          onChange={(e) => set("pickup", e.target.value === "" ? undefined : e.target.value)}
          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-[13px] bg-sky-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">Doesn't matter</option>
          <option value="true">Required</option>
          <option value="false">Not needed</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wide text-slate-400 block mb-1">Delivery</label>
        <select
          value={value.delivery ?? ""}
          onChange={(e) => set("delivery", e.target.value === "" ? undefined : e.target.value)}
          className="w-full border border-sky-100 rounded-xl px-3 py-2 text-[13px] bg-sky-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">Doesn't matter</option>
          <option value="true">Required</option>
          <option value="false">Not needed</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-400 block mb-1">Min rating</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="e.g. 4"
            value={value.minRating ?? ""}
            onChange={(e) => set("minRating", e.target.value)}
            className="w-full border border-sky-100 rounded-xl px-3 py-2 text-[13px] bg-sky-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-slate-400 block mb-1">Max price (₪)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 100"
            value={value.maxPrice ?? ""}
            onChange={(e) => set("maxPrice", e.target.value)}
            className="w-full border border-sky-100 rounded-xl px-3 py-2 text-[13px] bg-sky-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      </div>
    </div>
  );
}
