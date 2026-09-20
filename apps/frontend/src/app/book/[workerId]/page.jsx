"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingPageView from "@/components/BookingPageView";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ISRAEL_CITIES = [
  "Jerusalem",
  "Tel Aviv-Yafo",
  "Haifa",
  "Rishon LeZion",
  "Petah Tikva",
  "Ashdod",
  "Netanya",
  "Be'er Sheva",
  "Holon",
  "Bnei Brak",
  "Ramat Gan",
  "Ashkelon",
  "Rehovot",
  "Bat Yam",
  "Herzliya",
  "Kfar Saba",
  "Hadera",
  "Modi'in-Maccabim-Re'ut",
  "Ramla",
  "Lod",
  "Nazareth",
  "Acre",
  "Tiberias",
  "Eilat",
];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function BookPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();

  const workerId = Number(params.workerId);
  const customerUserId = 1; // TODO: replace later

  const cityFromSearch = (searchParams.get("city") || "").trim();

  const [step, setStep] = useState(1);
  const [sameAsPickup, setSameAsPickup] = useState(false);

  // IMPORTANT: initialize EVERYTHING as strings so inputs are always controlled
  const [form, setForm] = useState({
    itemsCount: "",
    scheduledPickup: "",
    pickup: {
      city: "",
      street: "",
      building: "",
      apartmentHouse: "",
      floor: "",
    },
    delivery: {
      city: "",
      street: "",
      building: "",
      apartmentHouse: "",
      floor: "",
    },
    paymentMethod: "CASH",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [provider, setProvider] = useState(null);
  const [providerErr, setProviderErr] = useState("");

  const [workerHours, setWorkerHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursError, setHoursError] = useState("");

  // Load provider (use the search endpoint because it returns profile/services)
  useEffect(() => {
    if (!workerId) return;

    const controller = new AbortController();

    (async () => {
      try {
        setProviderErr("");
        const base = API_BASE.replace(/\/$/, "");

        // ✅ correct endpoint for “get worker by id”
        const data = await fetchJson(`${base}/api/workers/${workerId}`, {
          credentials: "include",
          signal: controller.signal,
        });

        // handle different shapes safely
        const worker = data?.data?.worker || data?.data || data?.worker || data;

        setProvider(worker);
      } catch (e) {
        // ✅ ignore AbortError (Next dev refresh / navigation)
        if (e?.name === "AbortError" || String(e?.message).includes("aborted"))
          return;

        setProvider(null);
        setProviderErr(e?.message || "Failed to load provider");
      }
    })();

    return () => controller.abort();
  }, [workerId]);

  // Load worker hours
  useEffect(() => {
    if (!workerId) return;

    const controller = new AbortController();

    (async () => {
      try {
        setHoursLoading(true);
        setHoursError("");
        const base = API_BASE.replace(/\/$/, "");

        const data = await fetchJson(`${base}/api/workers/${workerId}/hours`, {
          credentials: "include",
          signal: controller.signal,
        });

        const hours = data?.data || data;
        setWorkerHours(Array.isArray(hours) ? hours : []);
      } catch (e) {
        if (e?.name === "AbortError" || String(e?.message).includes("aborted"))
          return;

        setWorkerHours([]);
        setHoursError(e?.message || "Failed to load worker hours");
      } finally {
        setHoursLoading(false);
      }
    })();

    return () => controller.abort();
  }, [workerId]);

  // Auto-fill pickup/delivery city from ?city=
  useEffect(() => {
    if (!cityFromSearch) return;

    setForm((prev) => {
      // only auto-fill if empty (don’t overwrite user typing)
      const pickupCity = prev.pickup.city || cityFromSearch;
      const deliveryCity = prev.delivery.city || cityFromSearch;
      return {
        ...prev,
        pickup: { ...prev.pickup, city: pickupCity },
        delivery: { ...prev.delivery, city: deliveryCity },
      };
    });
  }, [cityFromSearch]);

  // Build dropdown options:
  // show the selected city + worker city (if exists), otherwise fallback to full list
  const cityOptions = useMemo(() => {
    const s = new Set();
    if (cityFromSearch) s.add(cityFromSearch);
    const workerCity = provider?.profile?.city?.trim();
    if (workerCity) s.add(workerCity);

    const arr = Array.from(s).filter(Boolean);
    return arr.length ? arr : ISRAEL_CITIES;
  }, [cityFromSearch, provider]);

  function handleChange(path, value) {
    setForm((prev) => {
      const copy = structuredClone(prev);
      let obj = copy;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return copy;
    });

    // clear error for that field when user edits
    const key = path.join(".");
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSameAsPickupToggle(checked) {
    setSameAsPickup(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        delivery: { ...prev.pickup },
      }));
    }
  }
  function validateWorkerRequirements(e) {
    if (!provider) return;

    const workerCity = provider?.profile?.city?.trim();

    // 1. Customer city must match worker city
    if (workerCity && form.pickup.city && form.pickup.city !== workerCity) {
      e["pickup.city"] = `This worker only accepts orders in ${workerCity}`;
    }

    if (workerCity && form.delivery.city && form.delivery.city !== workerCity) {
      e["delivery.city"] = `This worker only delivers in ${workerCity}`;
    }

    // 2. Payment method check
    const acceptsBit = provider?.profile?.acceptsBit;
    if (form.paymentMethod === "BIT" && acceptsBit === false) {
      e["paymentMethod"] = "This worker does not accept Bit payments";
    }

    // 3. Items limit check
    const maxItems = provider?.profile?.maxItemsPerOrder;
    if (maxItems && Number(form.itemsCount) > Number(maxItems)) {
      e["itemsCount"] = `This worker accepts up to ${maxItems} items`;
    }

    // 4. Worker hours check
    if (form.scheduledPickup && workerHours.length > 0) {
      const selectedDate = new Date(form.scheduledPickup);
      const selectedDay = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const worksThatDay = workerHours.some(
        (h) => h.dayOfWeek === selectedDay && h.isAvailable !== false,
      );

      if (!worksThatDay) {
        e["scheduledPickup"] = `This worker is not available on ${selectedDay}`;
      }
    }
  }

  function validateStep(nextStep) {
    const e = {};

    if (nextStep >= 1) {
      if (!String(form.itemsCount || "").trim())
        e["itemsCount"] = "Number of items is required";
      if (!String(form.scheduledPickup || "").trim())
        e["scheduledPickup"] = "Pickup date & time is required";
    }

    if (nextStep >= 2) {
      if (!String(form.pickup.city || "").trim())
        e["pickup.city"] = "Pickup city is required";
      if (!String(form.pickup.street || "").trim())
        e["pickup.street"] = "Pickup street is required";
      if (!String(form.pickup.apartmentHouse || "").trim())
        e["pickup.apartmentHouse"] = "Pickup apartment / house is required";

      if (!sameAsPickup) {
        if (!String(form.delivery.city || "").trim())
          e["delivery.city"] = "Delivery city is required";
        if (!String(form.delivery.street || "").trim())
          e["delivery.street"] = "Delivery street is required";
        if (!String(form.delivery.apartmentHouse || "").trim())
          e["delivery.apartmentHouse"] =
            "Delivery apartment / house is required";
      }
    }
    validateWorkerRequirements(e);

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    const nextStep = Math.min(3, step + 1);
    if (!validateStep(nextStep)) return;
    setStep(nextStep);
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const body = {
        workerId,
        customerUserId,
        itemsCount: Number(form.itemsCount),
        scheduledPickup: form.scheduledPickup,
        pickup: {
          ...form.pickup,
          building: form.pickup.building ? Number(form.pickup.building) : null,
          apartmentHouse: form.pickup.apartmentHouse
            ? String(form.pickup.apartmentHouse)
            : null,
          floor: form.pickup.floor ? Number(form.pickup.floor) : null,
        },
        delivery: sameAsPickup
          ? {
              ...form.pickup,
              building: form.pickup.building
                ? Number(form.pickup.building)
                : null,
              apartmentHouse: form.pickup.apartmentHouse
                ? String(form.pickup.apartmentHouse)
                : null,
              floor: form.pickup.floor ? Number(form.pickup.floor) : null,
            }
          : {
              ...form.delivery,
              building: form.delivery.building
                ? Number(form.delivery.building)
                : null,
              apartmentHouse: form.delivery.apartmentHouse
                ? String(form.delivery.apartmentHouse)
                : null,
              floor: form.delivery.floor ? Number(form.delivery.floor) : null,
            },
        paymentMethod: form.paymentMethod,
        notes: form.notes || null,
      };

      const base = API_BASE.replace(/\/$/, "");
      await fetchJson(`${base}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      setSuccess(true);
    } catch (err) {
      setServerError(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm({
      itemsCount: "",
      scheduledPickup: "",
      pickup: {
        city: cityFromSearch || "",
        street: "",
        building: "",
        apartmentHouse: "",
        floor: "",
      },
      delivery: {
        city: cityFromSearch || "",
        street: "",
        building: "",
        apartmentHouse: "",
        floor: "",
      },
      paymentMethod: "CASH",
      notes: "",
    });
    setErrors({});
    setSuccess(false);
    setServerError(null);
    setSameAsPickup(false);
    setStep(1);
  }

  return (
    <BookingPageView
      step={step}
      setStep={setStep}
      form={form}
      sameAsPickup={sameAsPickup}
      provider={provider}
      providerErr={providerErr}
      workerHours={workerHours}
      hoursLoading={hoursLoading}
      hoursError={hoursError}
      errors={errors}
      submitting={submitting}
      success={success}
      serverError={serverError}
      cityOptions={cityOptions}
      handleChange={handleChange}
      handleSameAsPickupToggle={handleSameAsPickupToggle}
      handleReset={handleReset}
      goNext={goNext}
      goBack={goBack}
      handleSubmit={handleSubmit}
    />
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookPageInner />
    </Suspense>
  );
}
