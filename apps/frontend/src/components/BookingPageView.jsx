"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ModernDateTimePicker from "@/components/ui/ModernDateTimePicker";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

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
  const [h, m] = String(v)
    .split(":")
    .map((x) => parseInt(x, 10));
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
    row?.end_hhmm || row?.end_time || row?.end || row?.to || row?.endTime || ""
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
  const [workerServices, setWorkerServices] = useState([]);
  const [selectedServiceCodes, setSelectedServiceCodes] = useState([]);

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
    selectedServices: [],
    paymentMethod: "cash",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const workerName = useMemo(() => {
    if (!worker) return "Worker";
    if (worker?.user) {
      const nm =
        `${worker.user.first_name || ""} ${worker.user.last_name || ""}`.trim();
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

        const sRes = await fetch(
          `${API_BASE}/api/workers/${workerId}/services`,
        );
        const sJson = sRes.ok ? await sRes.json() : [];

        const workerServicesData = Array.isArray(sJson?.data)
          ? sJson.data
          : Array.isArray(sJson)
            ? sJson
            : [];

        if (cancelled) return;

        setWorker(w);
        setHours(h);
        setWorkerServices(workerServicesData);

        const chosenCity =
          cityFromSearch ||
          w?.city_name ||
          w?.user?.city_name ||
          w?.profile?.city ||
          w?.city ||
          "";

        setForm((prev) => ({
          ...prev,
          pickupCity: prev.pickupCity || chosenCity,
          deliveryCity: prev.deliveryCity || chosenCity,
        }));
      } catch (e) {
        if (!cancelled) {
          setFatalError(e?.message || "Failed loading booking data");
        }
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

  function validateStep(stepToValidate = step) {
    const nextErrors = {};

    if (stepToValidate === 1) {
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

    if (stepToValidate === 3) {
      if (!form.pickupCity) {
        nextErrors.pickupCity = "Pickup city is required";
      }

      if (!form.pickupStreet) {
        nextErrors.pickupStreet = "Pickup street is required";
      }

      if (!form.pickupApartment) {
        nextErrors.pickupApartment = "Pickup apartment / house is required";
      }

      if (!form.sameAsPickup) {
        if (!form.deliveryCity) {
          nextErrors.deliveryCity = "Delivery city is required";
        }

        if (!form.deliveryStreet) {
          nextErrors.deliveryStreet = "Delivery street is required";
        }

        if (!form.deliveryApartment) {
          nextErrors.deliveryApartment =
            "Delivery apartment / house is required";
        }
      }
    }

    if (stepToValidate === 4) {
      if (!form.paymentMethod) {
        nextErrors.paymentMethod = "Payment method is required";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function onNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1));
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
    if (submitting) return;

    const ok1 = validateStep(1);
    if (!ok1) {
      setStep(1);
      return;
    }

    const ok2 = validateStep(2);
    if (!ok2) {
      setStep(2);
      return;
    }

    const ok3 = validateStep(3);
    if (!ok3) {
      setStep(3);
      return;
    }
    const ok4 = validateStep(4);
    if (!ok4) {
      setStep(4);
      return;
    }

    try {
      setSubmitting(true);

      const customerUserId = localStorage.getItem("userId");

      if (!customerUserId) {
        setSubmitting(false);
        alert("You must be logged in to create an order");
        router.push("/signin");
        return;
      }

      const pickupDate = new Date(form.pickupAt);

      const deliveryDate = new Date(pickupDate);
      deliveryDate.setHours(deliveryDate.getHours() + 4);

      const toNumberOrNull = (value) => {
        if (value === "" || value == null) return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      };

      const toRequiredNumber = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };

      const payload = {
        customerUserId: String(customerUserId),
        workerId: String(workerId),

        // Pricing
        amount: totalPrice,
        washPrice,
        extraServicesPrice,
        washesCount,

        // Selected services
        selectedServices: selectedServiceCodes,

        pickup: {
          city: form.pickupCity,
          street: form.pickupStreet,
          building: toNumberOrNull(form.pickupBuilding),
          apartmentHouse: toRequiredNumber(form.pickupApartment),
          floor: toNumberOrNull(form.pickupFloor),
        },

        delivery: {
          city: form.sameAsPickup ? form.pickupCity : form.deliveryCity,
          street: form.sameAsPickup ? form.pickupStreet : form.deliveryStreet,
          building: form.sameAsPickup
            ? toNumberOrNull(form.pickupBuilding)
            : toNumberOrNull(form.deliveryBuilding),
          apartmentHouse: form.sameAsPickup
            ? toRequiredNumber(form.pickupApartment)
            : toRequiredNumber(form.deliveryApartment),
          floor: form.sameAsPickup
            ? toNumberOrNull(form.pickupFloor)
            : toNumberOrNull(form.deliveryFloor),
        },

        scheduledPickup: form.pickupAt,
        scheduledDropoff: deliveryDate.toISOString().slice(0, 16),
        itemsCount: Number(form.itemsCount),

        paymentMethod: form.paymentMethod.toUpperCase(),

        notes: form.notes || null,
      };

      console.log("CREATE ORDER PAYLOAD:", payload);

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create order");
      }

      setCreatedOrder(data);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("CREATE ORDER ERROR:", error);
      alert(error.message || "Something went wrong while creating the order");
      setSubmitting(false);
    }
  }
  const itemsCountNumber = Number(form.itemsCount || 0);
  const maxItemsPerWash = Number(worker?.max_items_per_wash || 1);
  const pricePerWash = Number(worker?.price_per_wash || 0);

  const washesCount =
    itemsCountNumber > 0 ? Math.ceil(itemsCountNumber / maxItemsPerWash) : 0;

  const washPrice = washesCount * pricePerWash;

  const extraServicesPrice = selectedServiceCodes.reduce((sum, code) => {
    const service = workerServices.find((s) => s.service_code === code);
    return sum + Number(service?.base_price || 0);
  }, 0);

  const totalPrice = washPrice + extraServicesPrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF8FB] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-12 w-80 mx-auto rounded-full bg-white/70 animate-pulse mb-4" />
          <div className="h-5 w-96 mx-auto rounded-full bg-white/60 animate-pulse mb-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 animate-pulse">
              <div className="h-6 w-28 rounded-full bg-slate-100 mb-6" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100" />
                <div>
                  <div className="h-6 w-40 rounded-full bg-slate-100 mb-3" />
                  <div className="h-4 w-24 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="mt-6 h-36 rounded-2xl bg-slate-100" />
            </aside>

            <main className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-pulse">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-5 w-24 rounded-full bg-slate-100" />
                <div className="flex-1 h-px bg-slate-100" />
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-5 w-24 rounded-full bg-slate-100" />
              </div>

              <div className="border-t border-slate-100 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-20 rounded-2xl bg-slate-100" />
                  <div className="h-20 rounded-2xl bg-slate-100" />
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <div className="h-12 w-24 rounded-2xl bg-slate-100" />
                <div className="h-12 w-28 rounded-2xl bg-slate-100" />
              </div>
            </main>
          </div>
        </div>
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
        <h1 className="text-5xl font-black text-center">
          Book Laundry Service
        </h1>
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

              <div className="flex justify-between text-slate-600 mt-2">
                <span>Washes needed</span>
                <span>{washesCount}</span>
              </div>

              <div className="flex justify-between text-slate-600 mt-2">
                <span>Price per wash</span>
                <span>₪{pricePerWash}</span>
              </div>

              <div className="flex justify-between text-slate-600 mt-2">
                <span>Laundry cost</span>
                <span>₪{washPrice}</span>
              </div>

              <div className="flex justify-between text-slate-600 mt-2">
                <span>Extra services</span>
                <span>₪{extraServicesPrice}</span>
              </div>

              {selectedServiceCodes.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  {selectedServiceCodes.map((code) => {
                    const service = workerServices.find(
                      (s) => s.service_code === code,
                    );

                    return (
                      <div
                        key={code}
                        className="flex justify-between text-sm text-slate-600"
                      >
                        <span>{service?.Service?.display_name || code}</span>
                        <span>₪{service?.base_price || 0}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between font-bold text-lg text-slate-900 border-t pt-3 mt-3">
                <span>Total</span>
                <span>₪{totalPrice}</span>
              </div>
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
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                1
              </div>
              <div className="font-bold">Schedule</div>

              <div className="flex-1 h-px bg-slate-200 mx-2" />

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                2
              </div>
              <div className="font-bold">Addresses</div>

              <div className="flex-1 h-px bg-slate-200 mx-2" />

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                3
              </div>
              <div className="font-bold">Payment</div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label="Number of items"
                    required
                    error={errors.itemsCount}
                  >
                    <input
                      className={inputClass(!!errors.itemsCount)}
                      value={form.itemsCount}
                      onChange={(e) => setField("itemsCount", e.target.value)}
                      placeholder="e.g. 5"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field
                    label="Pickup date & time"
                    required
                    error={errors.pickupAt}
                  >
                    <ModernDateTimePicker
                      value={form.pickupAt}
                      onChange={(value) => setField("pickupAt", value)}
                      availability={availability}
                    />
                  </Field>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Choose extra services</h2>

                  {workerServices.length === 0 ? (
                    <p className="text-slate-500">
                      No extra services available
                    </p>
                  ) : (
                    workerServices.map((service) => {
                      const checked = selectedServiceCodes.includes(
                        service.service_code,
                      );

                      return (
                        <button
                          key={service.service_code}
                          type="button"
                          onClick={() =>
                            setSelectedServiceCodes((prev) =>
                              checked
                                ? prev.filter((x) => x !== service.service_code)
                                : [...prev, service.service_code],
                            )
                          }
                          className={`w-full flex justify-between items-center p-4 rounded-2xl border transition ${
                            checked
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-bold text-slate-800">
                              {service.Service?.display_name ||
                                service.service_code}
                            </div>

                            {service.Service?.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {service.Service.description}
                              </p>
                            )}
                          </div>

                          <div className="font-bold text-blue-700">
                            +₪{service.base_price || 0}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10">
                  <section>
                    <h2 className="text-2xl font-bold">Pickup address</h2>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="City" required error={errors.pickupCity}>
                        <select
                          className={inputClass(!!errors.pickupCity)}
                          value={form.pickupCity}
                          onChange={(e) =>
                            setField("pickupCity", e.target.value)
                          }
                        >
                          <option value="">Choose a city</option>
                          {cityOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="Street"
                        required
                        error={errors.pickupStreet}
                      >
                        <input
                          className={inputClass(!!errors.pickupStreet)}
                          value={form.pickupStreet}
                          onChange={(e) =>
                            setField("pickupStreet", e.target.value)
                          }
                          placeholder="e.g. Derech Allenby"
                        />
                      </Field>

                      <Field label="Building" error={errors.pickupBuilding}>
                        <input
                          className={inputClass(false)}
                          value={form.pickupBuilding}
                          onChange={(e) =>
                            setField("pickupBuilding", e.target.value)
                          }
                          placeholder="e.g. 10"
                        />
                      </Field>

                      <Field
                        label="Apartment / House"
                        required
                        error={errors.pickupApartment}
                      >
                        <input
                          className={inputClass(!!errors.pickupApartment)}
                          value={form.pickupApartment}
                          onChange={(e) =>
                            setField("pickupApartment", e.target.value)
                          }
                          placeholder="e.g. 4A"
                        />
                      </Field>

                      <Field label="Floor">
                        <input
                          className={inputClass(false)}
                          value={form.pickupFloor}
                          onChange={(e) =>
                            setField("pickupFloor", e.target.value)
                          }
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
                          onChange={(e) =>
                            setField("sameAsPickup", e.target.checked)
                          }
                        />
                        Same as pickup
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field
                        label="City"
                        required={!form.sameAsPickup}
                        error={errors.deliveryCity}
                      >
                        <select
                          className={inputClass(!!errors.deliveryCity)}
                          value={form.deliveryCity}
                          onChange={(e) =>
                            setField("deliveryCity", e.target.value)
                          }
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

                      <Field
                        label="Street"
                        required={!form.sameAsPickup}
                        error={errors.deliveryStreet}
                      >
                        <input
                          className={inputClass(!!errors.deliveryStreet)}
                          value={form.deliveryStreet}
                          onChange={(e) =>
                            setField("deliveryStreet", e.target.value)
                          }
                          placeholder="e.g. Ben Yehuda"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field label="Building" error={errors.deliveryBuilding}>
                        <input
                          className={inputClass(false)}
                          value={form.deliveryBuilding}
                          onChange={(e) =>
                            setField("deliveryBuilding", e.target.value)
                          }
                          placeholder="e.g. 10"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field
                        label="Apartment / House"
                        required={!form.sameAsPickup}
                        error={errors.deliveryApartment}
                      >
                        <input
                          className={inputClass(!!errors.deliveryApartment)}
                          value={form.deliveryApartment}
                          onChange={(e) =>
                            setField("deliveryApartment", e.target.value)
                          }
                          placeholder="e.g. 2"
                          disabled={form.sameAsPickup}
                        />
                      </Field>

                      <Field label="Floor">
                        <input
                          className={inputClass(false)}
                          value={form.deliveryFloor}
                          onChange={(e) =>
                            setField("deliveryFloor", e.target.value)
                          }
                          placeholder="e.g. 1"
                          disabled={form.sameAsPickup}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <Field
                    label="Payment method"
                    required
                    error={errors.paymentMethod}
                  >
                    <select
                      className={inputClass(!!errors.paymentMethod)}
                      value={form.paymentMethod}
                      onChange={(e) =>
                        setField("paymentMethod", e.target.value)
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="bit">Bit</option>
                    </select>
                  </Field>

                  {form.paymentMethod === "bit" && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                      After creating the order, you will be asked to upload a
                      Bit payment screenshot from your order details page.
                    </div>
                  )}

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
                  step === 1
                    ? "bg-slate-100 text-slate-400 border-slate-100"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Back
              </button>

              {step < 4 ? (
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
                  disabled={submitting}
                  className={`px-8 py-3 rounded-2xl text-white font-bold transition ${
                    submitting
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? "Creating order..." : "Confirm booking"}
                </button>
              )}
            </div>
            {successModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <span className="text-3xl">✓</span>
                  </div>

                  <h2 className="text-center text-2xl font-bold text-slate-900">
                    Booking created
                  </h2>

                  <p className="mt-3 text-center text-slate-600">
                    Your order was sent to the worker and is now waiting for
                    approval.
                  </p>

                  {createdOrder?.id && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-500">Order number</p>
                      <p className="text-xl font-bold text-slate-800">
                        #{createdOrder.id}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push("/customer")}
                    className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
                  >
                    Go to my orders
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
