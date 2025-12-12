"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function BookPage() {
  const params = useParams();              // ✅ get params from Next
  const workerId = Number(params.workerId); // "5" -> 5
  const customerUserId = 1;


  console.log("WORKER ID FROM URL:", workerId);



const [sameAsPickup, setSameAsPickup] = useState(false);

function handleSameAsPickupToggle(e) {
  const checked = e.target.checked;
  setSameAsPickup(checked);

  if (checked) {
    // copy pickup -> delivery once when checkbox is turned on
    setForm(prev => ({
      ...prev,
      delivery: { ...prev.pickup },
    }));
  }
}


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

  function validateForm() {
    const newErrors = {};

    // itemsCount
    if (!form.itemsCount) {
      newErrors.itemsCount = "Number of items is required";
    } else {
      const n = Number(form.itemsCount);
      if (!Number.isInteger(n) || n <= 0) {
        newErrors.itemsCount = "Must be a positive whole number";
      }
    }

    // scheduledPickup
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

    // helper for required city/street
    function requireNonEmpty(key, value, label) {
      if (!value || !value.trim()) {
        newErrors[key] = `${label} is required`;
      }
    }

    // pickup city/street
    requireNonEmpty("pickup.city", form.pickup.city, "Pickup city");
    requireNonEmpty("pickup.street", form.pickup.street, "Pickup street");

    // delivery city/street
    requireNonEmpty("delivery.city", form.delivery.city, "Delivery city");
    requireNonEmpty("delivery.street", form.delivery.street, "Delivery street");

    // helper for optional int
    function validateOptionalInt(key, value, label) {
      if (!value) return;
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) {
        newErrors[key] = `${label} must be a non-negative integer`;
      }
    }

    // pickup numeric optional fields
    validateOptionalInt(
      "pickup.building",
      form.pickup.building,
      "Pickup building"
    );
    validateOptionalInt(
      "pickup.apartmentHouse",
      form.pickup.apartmentHouse,
      "Pickup apartment / house"
    );
    validateOptionalInt("pickup.floor", form.pickup.floor, "Pickup floor");

    // delivery numeric optional fields
    validateOptionalInt(
      "delivery.building",
      form.delivery.building,
      "Delivery building"
    );
    validateOptionalInt(
      "delivery.apartmentHouse",
      form.delivery.apartmentHouse,
      "Delivery apartment / house"
    );
    validateOptionalInt(
      "delivery.floor",
      form.delivery.floor,
      "Delivery floor"
    );

    // payment method
    if (!["CASH", "BIT"].includes(form.paymentMethod)) {
      newErrors.paymentMethod = "Invalid payment method";
    }

    // notes length
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
        scheduledPickup: form.scheduledPickup, // backend parses to Date
        pickup: {
          ...form.pickup,
          building: form.pickup.building
            ? Number(form.pickup.building)
            : null,
          apartmentHouse: form.pickup.apartmentHouse
            ? Number(form.pickup.apartmentHouse)
            : null,
          floor: form.pickup.floor ? Number(form.pickup.floor) : null,
        },
        delivery: {
          ...form.delivery,
          building: form.delivery.building
            ? Number(form.delivery.building)
            : null,
          apartmentHouse: form.delivery.apartmentHouse
            ? Number(form.delivery.apartmentHouse)
            : null,
          floor: form.delivery.floor ? Number(form.delivery.floor) : null,
        },
        paymentMethod: form.paymentMethod, // CASH or BIT
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      console.log("Order created:", data);
      setSuccess(true);
      // optional: reset form here
      // setForm(...);
    } catch (err) {
      console.error("Create order error:", err);
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

  setErrors({});
  setSuccess(false);
  setServerError(null);
}


  return (
  <div className="booking-page">
    <div className="booking-card">
      <header className="booking-header">
        <h1>Book Laundry Service</h1>
        <p>
          Choose pickup time and address and we’ll calculate the washes
          automatically.
        </p>
      </header>

      {serverError && <div className="alert alert-error">{serverError}</div>}
      {success && (
        <div className="alert alert-success">
          Booking created successfully! 🎉
        </div>
      )}

      <form className="booking-form" onSubmit={handleSubmit}>
        {/* TOP ROW: items + date */}
        <section className="section">
          <div className="row row-2">
            <div className="field">
              <label className="field-label">
                Number of items
                <span className="required-star">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 25"
                value={form.itemsCount}
                onChange={(e) =>
                  handleChange(["itemsCount"], e.target.value)
                }
                required
              />
              {errors.itemsCount && (
                <div className="field-error">{errors.itemsCount}</div>
              )}
            </div>

            <div className="field">
              <label className="field-label">
                Pickup date &amp; time
                <span className="required-star">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.scheduledPickup}
                onChange={(e) =>
                  handleChange(["scheduledPickup"], e.target.value)
                }
                required
              />
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