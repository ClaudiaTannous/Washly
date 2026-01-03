"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const FALLBACK_CITIES = [
  "Haifa",
  "Tel Aviv-Yafo",
  "Jerusalem",
  "Rishon LeZion",
  "Petah Tikva",
  "Ashdod",
  "Netanya",
  "Beersheba",
  "Holon",
  "Bnei Brak",
  "Ramat Gan",
  "Rehovot",
  "Bat Yam",
  "Herzliya",
  "Kfar Saba",
  "Hadera",
  "Nazareth",
  "Acre",
  "Eilat",
];

function hhmmToMin(v) {
  if (!v) return null;
  const [h, m] = String(v).split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function getHourField(row, kind /* "start" | "end" */) {
  // support multiple backend naming styles
  if (kind === "start") {
    return (
      row?.start_hhmm ||
      row?.start_time ||
      row?.start ||
      row?.from ||
      row?.startTime ||
      ""
    );
  }
  return (
    row?.end_hhmm ||
    row?.end_time ||
    row?.end ||
    row?.to ||
    row?.endTime ||
    ""
  );
}

function getDayField(row) {
  const d =
    row?.day_of_week ??
    row?.dayOfWeek ??
    row?.day ??
    row?.day_index ??
    row?.dow;
  const n = Number(d);
  return Number.isNaN(n) ? null : n;
}

function isWithinBusinessHours(businessHours, pickupISO) {
  if (!pickupISO) return true;
  const d = new Date(pickupISO);
  if (Number.isNaN(d.getTime())) return false;

  const day = d.getDay(); // 0 Sun .. 6 Sat
  const mins = d.getHours() * 60 + d.getMinutes();

  const todays = (businessHours || []).filter((r) => getDayField(r) === day);
  if (todays.length === 0) return false;

  return todays.some((r) => {
    const start = hhmmToMin(getHourField(r, "start"));
    const end = hhmmToMin(getHourField(r, "end"));
    if (start === null || end === null) return false;
    return mins >= start && mins <= end;
  });
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full px-4 py-3 rounded-2xl border outline-none transition ${
    hasError ? "border-red-400" : "border-slate-200"
  } focus:ring-2 focus:ring-blue-200 bg-white`;
}

export default function BookingPageView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const workerId = params?.workerId;
  const cityFromSearch = (searchParams?.get("city") || "").trim();

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [hours, setHours] = useState([]);
  const [fatalError, setFatalError] = useState("");

  const [step, setStep] = useState(1);

  // initialize everything as "" => no uncontrolled/controlled warnings
  const [form, setForm] = useState({
    itemsCount: "",
    pickupAt: "",

    pickupCity: "",
    pickupStreet: "",
    pickupBuilding: "",
    pickupApartment: "",
    pickupFloor: "",

    sameAsPickup: true,

    deliveryCity: "",
    deliveryStreet: "",
    deliveryBuilding: "",
    deliveryApartment: "",
    deliveryFloor: "",

    paymentMethod: "cash",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  const workerName = useMemo(() => {
    if (!worker) return "Worker";
    if (worker?.user) {
      const nm = `${worker.user.first_name || ""} ${worker.user.last_name || ""}`.trim();
      return nm || "Worker";
    }
    return worker?.profile?.name || worker?.name || "Worker";
  }, [worker]);

  const workerCity = useMemo(() => {
    if (!worker) return "";
    return (
      worker?.city_name ||
      worker?.user?.city_name ||
      worker?.profile?.city ||
      worker?.city ||
      ""
    );
  }, [worker]);

  // ✅ IMPORTANT: options must include the selected value, otherwise <select> looks empty
  const cityOptions = useMemo(() => {
    const s = new Set();
    if (cityFromSearch) s.add(cityFromSearch);
    if (workerCity) s.add(workerCity);

    // If you truly want ONLY worker cities, keep just these 2 lines above.
    // If none exist, fall back to a list so the dropdown isn't empty:
    if (s.size === 0) FALLBACK_CITIES.forEach((c) => s.add(c));

    return Array.from(s);
  }, [cityFromSearch, workerCity]);

  // fetch worker + business hours
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setFatalError("");

        const wRes = await fetch(`${API_BASE}/api/workers/${workerId}`);
        if (!wRes.ok) throw new Error(await wRes.text());
        const wJson = await wRes.json();
        const w = wJson?.data || wJson;

        const hRes = await fetch(`${API_BASE}/api/workers/${workerId}/hours`);
        const hJson = hRes.ok ? await hRes.json() : [];
        const h = Array.isArray(hJson?.data)
          ? hJson.data
          : Array.isArray(hJson)
            ? hJson
            : [];

        if (cancelled) return;

        setWorker(w);
        setHours(h);

        const chosenCity =
          cityFromSearch ||
          (w?.city_name || w?.user?.city_name || w?.profile?.city || w?.city || "") ||
          "";

        setForm((prev) => ({
          ...prev,
          pickupCity: prev.pickupCity || chosenCity,
          deliveryCity: prev.deliveryCity || chosenCity,
        }));
      } catch (e) {
        if (!cancelled) setFatalError(e?.message || "Failed loading booking data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (workerId) load();
    return () => {
      cancelled = true;
    };
  }, [workerId, cityFromSearch]);

  // keep delivery synced if sameAsPickup
  useEffect(() => {
    if (!form.sameAsPickup) return;
    setForm((prev) => ({
      ...prev,
      deliveryCity: prev.pickupCity,
      deliveryStreet: prev.pickupStreet,
      deliveryBuilding: prev.pickupBuilding,
      deliveryApartment: prev.pickupApartment,
      deliveryFloor: prev.pickupFloor,
    }));
  }, [
    form.sameAsPickup,
    form.pickupCity,
    form.pickupStreet,
    form.pickupBuilding,
    form.pickupApartment,
    form.pickupFloor,
  ]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validateCurrentStep() {
    const nextErrors = {};

    if (step === 1) {
      const n = Number(form.itemsCount);
      if (!form.itemsCount || Number.isNaN(n) || n <= 0) {
        nextErrors.itemsCount = "Number of items is required";
      }
      if (!form.pickupAt) {
        nextErrors.pickupAt = "Pickup date & time is required";
      } else if (!isWithinBusinessHours(hours, form.pickupAt)) {
        nextErrors.pickupAt = "Pickup time is outside worker business hours";
      }
    }

    if (step === 2) {
      if (!form.pickupCity) nextErrors.pickupCity = "Pickup city is required";
      if (!form.pickupStreet) nextErrors.pickupStreet = "Pickup street is required";
      if (!form.pickupApartment) nextErrors.pickupApartment = "Pickup apartment / house is required";

      if (!form.sameAsPickup) {
        if (!form.deliveryCity) nextErrors.deliveryCity = "Delivery city is required";
        if (!form.deliveryStreet) nextErrors.deliveryStreet = "Delivery street is required";
        if (!form.deliveryApartment) nextErrors.deliveryApartment = "Delivery apartment / house is required";
      }
    }

    if (step === 3) {
      if (!form.paymentMethod) nextErrors.paymentMethod = "Payment method is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function onNext() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(3, s + 1));
  }

  function onBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  function onReset() {
    setErrors({});
    setStep(1);
    const chosen = cityFromSearch || workerCity || "";
    setForm({
      itemsCount: "",
      pickupAt: "",
      pickupCity: chosen,
      pickupStreet: "",
      pickupBuilding: "",
      pickupApartment: "",
      pickupFloor: "",
      sameAsPickup: true,
      deliveryCity: chosen,
      deliveryStreet: "",
      deliveryBuilding: "",
      deliveryApartment: "",
      deliveryFloor: "",
      paymentMethod: "cash",
      notes: "",
    });
  }

  async function onSubmit() {
    // validate all steps
    const current = step;
    setStep(1);
    const ok1 = validateCurrentStep();
    if (!ok1) return;

    setStep(2);
    const ok2 = validateCurrentStep();
    if (!ok2) return;

    setStep(3);
    const ok3 = validateCurrentStep();
    if (!ok3) return;

    setStep(current);

    // TODO: implement POST to /api/orders when you’re ready
    alert("All good ✅ (submit API call here)");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF8FB] flex items-center justify-center">
        <div className="text-lg">Loading booking…</div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen bg-[#EBF8FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-6 max-w-xl w-full">
          <div className="text-xl font-bold mb-2">Could not load booking</div>
          <div className="text-red-600 whitespace-pre-wrap">{fatalError}</div>
          <button
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF8FB] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-center">Book Laundry Service</h1>
        <p className="text-center text-slate-600 mt-3">
          Complete the steps below to confirm your booking.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Provider */}
          <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="text-lg font-bold">Provider</div>
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                type="button"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                {(workerName?.[0] || "W").toUpperCase()}
              </div>
              <div>
                <div className="text-2xl font-bold">{workerName}</div>
                <div className="text-slate-500">{workerCity || "—"}</div>
              </div>
            </div>

            <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-100 p-5">
              <div className="font-bold mb-3">Booking summary</div>
              <div className="flex justify-between text-slate-600">
                <span>Items</span>
                <span>{form.itemsCount || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-600 mt-2">
                <span>Pickup</span>
                <span>{form.pickupAt || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-600 mt-2">
                <span>Pickup city</span>
                <span>{form.pickupCity || "—"}</span>
              </div>
            </div>
          </aside>

          {/* RIGHT: Steps */}
          <main className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            {/* step header */}
            <div className="flex items-center gap-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                1
              </div>
              <div className="font-bold">Schedule</div>

              <div className="flex-1 h-px bg-slate-200 mx-2" />

              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                2
              </div>
              <div className="font-bold">Addresses</div>

              <div className="flex-1 h-px bg-slate-200 mx-2" />

              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                3
              </div>
              <div className="font-bold">Payment</div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Number of items" required error={errors.itemsCount}>
                    <input
                      className={inputClass(!!errors.itemsCount)}
                      value={form.itemsCount}
                      onChange={(e) => setField("itemsCount", e.target.value)}
                      placeholder="e.g. 5"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field label="Pickup date & time" required error={errors.pickupAt}>
                    <input
                      type="datetime-local"
                      className={inputClass(!!errors.pickupAt)}
                      value={form.pickupAt}
                      onChange={(e) => setField("pickupAt", e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10">
                  <section>
                    <h2 className="text-2xl font-bold">Pickup address</h2>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="City" required error={errors.pickupCity}>
                        <select
                          className={inputClass(!!errors.pickupCity)}
                          value={form.pickupCity}
                          onChange={(e) => setField("pickupCity", e.target.value)}
                        >
                          <option value="">Choose a city</option>
                          {cityOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Street" required error={errors.pickupStreet}>
                        <input
                          className={inputClass(!!errors.pickupStreet)}
                          value={form.pickupStreet}
                          onChange={(e) => setField("pickupStreet", e.target.value)}
                          placeholder="e.g. Derech Allenby"
                        />
                      </Field>

                      <Field label="Building" error={errors.pickupBuilding}>
                        <input
                          className={inputClass(false)}
                          value={form.pickupBuilding}
                          onChange={(e) => setField("pickupBuilding", e.target.value)}
                          placeholder="e.g. 10"
                        />
                      </Field>

                      <Field label="Apartment / House" required error={errors.pickupApartment}>
                        <input
                          className={inputClass(!!errors.pickupApartment)}
                          value={form.pickupApartment}
                          onChange={(e) => setField("pickupApartment", e.target.value)}
                          placeholder="e.g. 4A"
                        />
                      </Field>

                      <Field label="Floor">
                        <input
                          className={inputClass(false)}
                          value={form.pickupFloor}
                          onChange={(e) => setField("pickupFloor", e.target.value)}
                          placeholder="e.g. 2"
                        />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Delivery address</h2>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.sameAsPickup}
                          onChange={(e) => setField("sameAsPickup", e.target.checked)}
                        />
                        Same as pickup
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="City" required={!form.sameAsPickup} error={errors.deliveryCity}>
                        <select
                          className={inputClass(!!errors.deliveryCity)}
                          value={form.deliveryCity}
                          onChange={(e) => setField("deliveryCity", e.target.value)}
                          disabled={form.sameAsPickup}
                        >
                          <option value="">Choose a city</option>
                          {cityOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Street" required={!form.sameAsPickup} error={errors.deliveryStreet}>
                        <input
                          className={inputClass(!!errors.deliveryStreet)}
                          value={form.deliveryStreet}
                          onChange={(e) => setField("deliveryStreet", e.target.value)}
                          placeholder="e.g. Ben Yehuda"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field label="Building" error={errors.deliveryBuilding}>
                        <input
                          className={inputClass(false)}
                          value={form.deliveryBuilding}
                          onChange={(e) => setField("deliveryBuilding", e.target.value)}
                          placeholder="e.g. 10"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field label="Apartment / House" required={!form.sameAsPickup} error={errors.deliveryApartment}>
                        <input
                          className={inputClass(!!errors.deliveryApartment)}
                          value={form.deliveryApartment}
                          onChange={(e) => setField("deliveryApartment", e.target.value)}
                          placeholder="e.g. 2"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field label="Floor">
                        <input
                          className={inputClass(false)}
                          value={form.deliveryFloor}
                          onChange={(e) => setField("deliveryFloor", e.target.value)}
                          placeholder="e.g. 1"
                          disabled={form.sameAsPickup}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <Field label="Payment method" required error={errors.paymentMethod}>
                    <select
                      className={inputClass(!!errors.paymentMethod)}
                      value={form.paymentMethod}
                      onChange={(e) => setField("paymentMethod", e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="bit">Bit</option>
                    </select>
                  </Field>

                  <Field label="Notes">
                    <textarea
                      className={`${inputClass(false)} min-h-[120px]`}
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      placeholder="Anything the worker should know?"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* footer buttons */}
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                disabled={step === 1}
                className={`px-6 py-3 rounded-2xl border ${
                  step === 1 ? "bg-slate-100 text-slate-400 border-slate-100" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                >
                  Confirm booking
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
