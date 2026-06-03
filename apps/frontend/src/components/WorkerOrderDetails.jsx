"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "./ui/button";

const BACKEND_URL = "http://localhost:5000";

export default function WorkerOrderDetails() {
  const { orderId } = useParams();
  const router = useRouter();

  const [notification, setNotification] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadOrder() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load order");

      setOrder(data);
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to load order",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  async function confirmPayment() {
    try {
      setActionLoading(true);

      const userId = localStorage.getItem("userId");

      const res = await fetch(
        `${BACKEND_URL}/api/orders/${order.id}/bit-payment/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ confirmedBy: userId }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to confirm payment");

      setOrder(data);
      setNotification({
        type: "success",
        message: "Payment confirmed successfully",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to confirm payment",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectPayment() {
    try {
      const reason = prompt("Why are you rejecting this payment proof?");

      setActionLoading(true);

      const res = await fetch(
        `${BACKEND_URL}/api/orders/${order.id}/bit-payment/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reason: reason || "Bit payment proof was rejected.",
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to reject payment");

      setOrder(data);
      setNotification({
        type: "error",
        message: "Payment proof rejected",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to reject payment",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        dir="ltr"
        className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-[#f8feff] p-6"
      >
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="mb-3 h-4 w-28 rounded-full bg-slate-200" />
              <div className="h-10 w-48 rounded-full bg-slate-200" />
            </div>

            <div className="h-10 w-24 rounded-2xl bg-white" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="h-40 rounded-3xl bg-white shadow-sm" />
              <div className="h-48 rounded-3xl bg-white shadow-sm" />
              <div className="h-48 rounded-3xl bg-white shadow-sm" />
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="h-80 rounded-3xl bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="p-10 text-center">Order not found</div>;
  }

  const customerName = order.Customer
    ? `${order.Customer.first_name} ${order.Customer.last_name}`
    : "Customer";

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-[#f8feff] p-6 text-left"
    >
      <div className="mx-auto max-w-7xl">
        {notification && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm ${
              notification.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className="font-medium">{notification.message}</span>

            <button
              onClick={() => setNotification(null)}
              className="font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-8 flex flex-row items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Order #{order.id}
            </h1>
          </div>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-2xl bg-white px-6"
          >
            ← Back
          </Button>
        </div>

        <div dir="ltr" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Section title="Customer Details">
              <p className="text-2xl font-bold text-slate-900">
                {customerName}
              </p>

              <p className="mt-1 text-slate-500">
                {order.Customer?.phone || "No phone number"}
              </p>
            </Section>

            {order.payment_method === "BIT" && (
              <Section title="Bit Payment Proof">
                <div className="mb-5 w-full rounded-2xl bg-blue-50 p-4">
                  <p className="font-bold text-blue-700">
                    {order.payment_status}
                  </p>
                </div>

                {order.PaymentProofs?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {order.PaymentProofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm"
                      >
                        <img
                          src={`${BACKEND_URL}${proof.image_url}`}
                          alt="Bit payment proof"
                          className="h-72 w-full rounded-2xl object-cover shadow-md transition hover:scale-[1.02]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-slate-50 p-4 text-slate-500">
                    No payment proof uploaded yet.
                  </div>
                )}

                {order.payment_status === "PENDING_VERIFICATION" && (
                  <div className="mt-6 flex w-full max-w-sm gap-3">
                    <Button
                      disabled={actionLoading}
                      onClick={confirmPayment}
                      className="flex-1 rounded-2xl bg-green-600 py-6 text-white hover:bg-green-700"
                    >
                      Confirm
                    </Button>

                    <Button
                      disabled={actionLoading}
                      variant="outline"
                      onClick={rejectPayment}
                      className="flex-1 rounded-2xl border-red-200 py-6 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Section>
            )}

            <Section title="Pickup Address">
              <AddressBlock
                city={order.pickup_city}
                street={order.pickup_street}
                building={order.pickup_building}
                apartment={order.pickup_apartment_house}
                floor={order.pickup_floor}
                time={order.scheduled_pickup}
                label="Pickup Time"
              />
            </Section>

            <Section title="Dropoff Address">
              <AddressBlock
                city={order.delivery_city}
                street={order.delivery_street}
                building={order.delivery_building}
                apartment={order.delivery_apartment_house}
                floor={order.delivery_floor}
                time={order.scheduled_dropoff}
                label="Dropoff Time"
              />
            </Section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Section title="Order Summary">
              <div className="grid grid-cols-1 gap-4">
                <Info title="Status" value={order.status} />
                <Info title="Items" value={order.items_count} />
                <Info title="Washes" value={order.washes_count} />
                <Info title="Amount" value={`₪${order.amount}`} />
                <Info title="Payment Method" value={order.payment_method} />
                <Info title="Payment Status" value={order.payment_status} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, centered = false }) {
  return (
    <div
      dir="ltr"
      className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ${
        centered ? "text-center" : "text-left"
      }`}
    >
      <h2
        className={`mb-5 text-xl font-bold text-slate-900 ${
          centered ? "text-center" : "text-left"
        }`}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-left">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-lg font-bold text-slate-900">
        {value ?? "N/A"}
      </p>
    </div>
  );
}

function AddressBlock({
  city,
  street,
  building,
  apartment,
  floor,
  time,
  label,
}) {
  return (
    <div className="space-y-2 text-left text-slate-700">
      <p className="text-lg font-bold text-slate-900">
        {city}, {street} {building || ""}
      </p>

      <p>Apartment / House: {apartment ?? "N/A"}</p>
      <p>Floor: {floor ?? "N/A"}</p>

      <p className="pt-2">
        <span className="font-semibold">{label}:</span>{" "}
        {time ? new Date(time).toLocaleString() : "N/A"}
      </p>
    </div>
  );
}
