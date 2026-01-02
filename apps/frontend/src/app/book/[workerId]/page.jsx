"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function BookPage() {
  const params = useParams();
  const workerId = Number(params.workerId);
  const customerUserId = 1;

  const [sameAsPickup, setSameAsPickup] = useState(false);

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

  // ✅ NEW: worker business hours state
  const [workerHours, setWorkerHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursError, setHoursError] = useState("");

  // ✅ NEW: fetch hours for this worker
  useEffect(() => {
    async function loadHours() {
      if (!workerId) return;

      setHoursLoading(true);
      setHoursError("");

      try {
        const base = API_BASE.replace(/\/$/, "");
        const res = await fetch(`${base}/api/workers/${workerId}/hours`, {
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load worker hours");

        setWorkerHours(Array.isArray(data) ? data : []);
      } catch (e) {
        setWorkerHours([]);
        setHoursError(e.message || "Failed to load worker hours");
      } finally {
        setHoursLoading(false);
      }
    }

    loadHours();
  }, [workerId]);

  function handleSameAsPickupToggle(e) {
    const checked = e.target.checked;
    setSameAsPickup(checked);

    if (checked) {
      setForm((prev) => ({
        ...prev,
        delivery: { ...prev.pickup },
      }));
    }
  }

  function handleChange(path, value) {
    setForm((prev) => {
      const copy = structuredClone(prev);
      let obj = copy;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return copy;
    });
  }

  // ✅ NEW: compute availability message for the chosen pickup time
  const pickupAvailability = useMemo(() => {
    if (!form.scheduledPickup) return { ok: true, msg: "" };

    // If hours aren't loaded yet, don't block
    if (hoursLoading) return { ok: true, msg: "" };

    // If worker has no hours defined, don't block (or you can block if you want)
    if (!workerHours || workerHours.length === 0) {
      return { ok: true, msg: "" };
    }

    const dt = new Date(form.scheduledPickup);
    if (Number.isNaN(dt.getTime())) return { ok: false, msg: "Invalid date/time" };

    const day = dt.getDay(); // 0=Sun..6=Sat
    const minutes = dt.getHours() * 60 + dt.getMinutes();

    const intervals = workerHours
      .filter((h) => h.day_of_week === day)
      .map((h) => ({
        start: hhmmToMinutes(h.start_hhmm),
        end: hhmmToMinutes(h.end_hhmm),
        label: `${h.start_hhmm}–${h.end_hhmm}`,
      }));

    if (intervals.length === 0) {
      return { ok: false, msg: "Worker has no working hours for this day." };
    }

    const insideAny = intervals.some((i) => minutes >= i.start && minutes <= i.end);

    if (!insideAny) {
      return {
        ok: false,
        msg: `Pick a time within: ${intervals.map((i) => i.label).join(", ")}`,
      };
    }

    return { ok: true, msg: "" };
  }, [form.scheduledPickup, workerHours, hoursLoading]);

  function validateForm() {
    const newErrors = {};

    if (!form.itemsCount) {
      newErrors.itemsCount = "Number of items is required";
    } else {
      const n = Number(form.itemsCount);
      if (!Number.isInteger(n) || n <= 0) {
        newErrors.itemsCount = "Must be a positive whole number";
      }
    }

    if (!form.scheduledPickup) {
      newErrors.scheduledPickup = "Pickup time is required";
    } else {
      const dt = new Date(form.scheduledPickup);
      if (Number.isNaN(dt.getTime())) {
        newErrors.scheduledPickup = "Invalid date/time";
      } else {
        const now = new Date();
        if (dt <= now) {
          newErrors.scheduledPickup = "Pickup time must be in the future";
        }
      }
    }

    // ✅ NEW: availability check included in validation
    if (!pickupAvailability.ok) {
      newErrors.scheduledPickup = pickupAvailability.msg;
    }

    function requireNonEmpty(key, value, label) {
      if (!value || !value.trim()) newErrors[key] = `${label} is required`;
    }

    requireNonEmpty("pickup.city", form.pickup.city, "Pickup city");
    requireNonEmpty("pickup.street", form.pickup.street, "Pickup street");

    requireNonEmpty("delivery.city", form.delivery.city, "Delivery city");
    requireNonEmpty("delivery.street", form.delivery.street, "Delivery street");

    function validateOptionalInt(key, value, label) {
      if (!value) return;
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) newErrors[key] = `${label} must be a non-negative integer`;
    }

    validateOptionalInt("pickup.building", form.pickup.building, "Pickup building");
    validateOptionalInt("pickup.apartmentHouse", form.pickup.apartmentHouse, "Pickup apartment / house");
    validateOptionalInt("pickup.floor", form.pickup.floor, "Pickup floor");

    validateOptionalInt("delivery.building", form.delivery.building, "Delivery building");
    validateOptionalInt("delivery.apartmentHouse", form.delivery.apartmentHouse, "Delivery apartment / house");
    validateOptionalInt("delivery.floor", form.delivery.floor, "Delivery floor");

    if (!["CASH", "BIT"].includes(form.paymentMethod)) {
      newErrors.paymentMethod = "Invalid payment method";
    }

    if (form.notes && form.notes.length > 1000) {
      newErrors.notes = "Notes are too long (max 1000 characters)";
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSubmitting(false);
      return;
    }

    try {
      const body = {
        customerUserId,
        workerId,
        itemsCount: Number(form.itemsCount),
        scheduledPickup: form.scheduledPickup,
        pickup: {
          ...form.pickup,
          building: form.pickup.building ? Number(form.pickup.building) : null,
          apartmentHouse: form.pickup.apartmentHouse ? Number(form.pickup.apartmentHouse) : null,
          floor: form.pickup.floor ? Number(form.pickup.floor) : null,
        },
        delivery: {
          ...form.delivery,
          building: form.delivery.building ? Number(form.delivery.building) : null,
          apartmentHouse: form.delivery.apartmentHouse ? Number(form.delivery.apartmentHouse) : null,
          floor: form.delivery.floor ? Number(form.delivery.floor) : null,
        },
        paymentMethod: form.paymentMethod,
        paymentNotes: null,
        notes: form.notes || null,
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

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
      pickup: { city: "", street: "", building: "", apartmentHouse: "", floor: "" },
      delivery: { city: "", street: "", building: "", apartmentHouse: "", floor: "" },
      paymentMethod: "CASH",
      notes: "",
    });

    setErrors({});
    setSuccess(false);
    setServerError(null);
    setSameAsPickup(false);
  }

  const disableSubmit = submitting || !pickupAvailability.ok;

  return (
    <div className="booking-page">
      <div className="booking-card">
        <header className="booking-header">
          <h1>Book Laundry Service</h1>
          <p>Choose pickup time and address and we’ll calculate the washes automatically.</p>
        </header>

        {/* ✅ Optional hours load message */}
        {hoursError && <div className="alert alert-error">Hours error: {hoursError}</div>}

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {success && <div className="alert alert-success">Booking created successfully! 🎉</div>}

        <form className="booking-form" onSubmit={handleSubmit}>
          <section className="section">
            <div className="row row-2">
              <div className="field">
                <label className="field-label">
                  Number of items <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 25"
                  value={form.itemsCount}
                  onChange={(e) => handleChange(["itemsCount"], e.target.value)}
                  required
                />
                {errors.itemsCount && <div className="field-error">{errors.itemsCount}</div>}
              </div>

              <div className="field">
                <label className="field-label">
                  Pickup date &amp; time <span className="required-star">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledPickup}
                  onChange={(e) => handleChange(["scheduledPickup"], e.target.value)}
                  required
                />

                {/* ✅ Availability error message shown here */}
                {errors.scheduledPickup && (
                  <div className="field-error">{errors.scheduledPickup}</div>
                )}
              </div>
            </div>
          </section>
        {/* PICKUP ADDRESS */}
        <section className="section">
          <h2>Pickup address</h2>

          <div className="row row-2">
            <div className="field">
              <label className="field-label">
                City
                <span className="required-star">*</span>
              </label>
              <input
                placeholder="city"
                value={form.pickup.city}
                onChange={(e) =>
                  handleChange(["pickup", "city"], e.target.value)
                }
                required
              />
              {errors["pickup.city"] && (
                <div className="field-error">{errors["pickup.city"]}</div>
              )}
            </div>
            <div className="field">
              <label className="field-label">
                Street
                <span className="required-star">*</span>
              </label>
              <input
                placeholder="street"
                value={form.pickup.street}
                onChange={(e) =>
                  handleChange(["pickup", "street"], e.target.value)
                }
                required
              />
              {errors["pickup.street"] && (
                <div className="field-error">{errors["pickup.street"]}</div>
              )}
            </div>
          </div>

          <div className="row row-3">
            <div className="field">
              <label>Building</label>
              <input
                placeholder="building"
                value={form.pickup.building}
                onChange={(e) =>
                  handleChange(["pickup", "building"], e.target.value)
                }
              />
              {errors["pickup.building"] && (
                <div className="field-error">{errors["pickup.building"]}</div>
              )}
            </div>
            <div className="field">
              <label className="field-label">
                Apartment / House
                <span className="required-star">*</span>
              </label>
              <input
                placeholder="apartment / house"
                value={form.pickup.apartmentHouse}
                onChange={(e) =>
                  handleChange(["pickup", "apartmentHouse"], e.target.value)
                }
                required
              />
              {errors["pickup.apartmentHouse"] && (
                <div className="field-error">
                  {errors["pickup.apartmentHouse"]}
                </div>
              )}
            </div>
            <div className="field">
              <label>Floor</label>
              <input
                placeholder="floor"
                value={form.pickup.floor}
                onChange={(e) =>
                  handleChange(["pickup", "floor"], e.target.value)
                }
              />
              {errors["pickup.floor"] && (
                <div className="field-error">{errors["pickup.floor"]}</div>
              )}
            </div>
          </div>
        </section>

       {/* DELIVERY ADDRESS */}
<section className="section">
  <div className="same-address-row">
    <h2>Delivery address</h2>

   <label className="same-address-toggle">
    <input
    type="checkbox"
    checked={sameAsPickup}
    onChange={handleSameAsPickupToggle}
  />
  <span>Same as pickup</span>
</label>

  </div>

  <div className="row row-2">
    <div className="field">
      <label className="field-label">
        City
        <span className="required-star">*</span>
      </label>
      <input
        placeholder="city"
        value={form.delivery.city}
        onChange={(e) =>
          handleChange(["delivery", "city"], e.target.value)
        }
        required
      />
      {errors["delivery.city"] && (
        <div className="field-error">{errors["delivery.city"]}</div>
      )}
    </div>
    <div className="field">
      <label className="field-label">
        Street
        <span className="required-star">*</span>
      </label>
      <input
        placeholder="street"
        value={form.delivery.street}
        onChange={(e) =>
          handleChange(["delivery", "street"], e.target.value)
        }
        required
      />
      {errors["delivery.street"] && (
        <div className="field-error">{errors["delivery.street"]}</div>
      )}
    </div>
  </div>

  <div className="row row-3">
    <div className="field">
      <label>Building</label>
      <input
        placeholder="building"
        value={form.delivery.building}
        onChange={(e) =>
          handleChange(["delivery", "building"], e.target.value)
        }
      />
      {errors["delivery.building"] && (
        <div className="field-error">{errors["delivery.building"]}</div>
      )}
    </div>
    <div className="field">
      <label className="field-label">
        Apartment / House
        <span className="required-star">*</span>
      </label>
      <input
        placeholder="apartment / house"
        value={form.delivery.apartmentHouse}
        onChange={(e) =>
          handleChange(["delivery", "apartmentHouse"], e.target.value)
        }
        required
      />
      {errors["delivery.apartmentHouse"] && (
        <div className="field-error">
          {errors["delivery.apartmentHouse"]}
        </div>
      )}
    </div>
    <div className="field">
      <label>Floor</label>
      <input
        placeholder="floor"
        value={form.delivery.floor}
        onChange={(e) =>
          handleChange(["delivery", "floor"], e.target.value)
        }
      />
      {errors["delivery.floor"] && (
        <div className="field-error">{errors["delivery.floor"]}</div>
      )}
    </div>
  </div>
</section>

        {/* PAYMENT + NOTES */}
        <section className="section">
          <h2>Payment</h2>

          <div className="row row-2">
            <div className="field">
              <label className="field-label">
                Payment method
                <span className="required-star">*</span>
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  handleChange(["paymentMethod"], e.target.value)
                }
                required
              >
                <option value="CASH">Cash</option>
                <option value="BIT">Bit</option>
              </select>
              {errors.paymentMethod && (
                <div className="field-error">{errors.paymentMethod}</div>
              )}
            </div>

            <div className="field field-notes">
              <label>Anything the worker should know?</label>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) =>
                  handleChange(["notes"], e.target.value)
                }
              />
              {errors.notes && (
                <div className="field-error">{errors.notes}</div>
              )}
            </div>
          </div>
        </section>

      <div className="actions">
  <button
    type="button"
    className="reset-btn"
    onClick={handleReset}
    disabled={submitting}
  >
    Reset
  </button>

  <button type="submit" className="confirm-btn" disabled={submitting}>
    {submitting ? "Booking..." : "Confirm booking"}
  </button>
</div>

      </form>
    </div>
  </div>
);
}