"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CustomerOrderDetails() {
  const { orderId } = useParams();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load order");
      }

      setOrder(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  async function uploadBitProof() {
    if (
      order.status === "CANCELLED" ||
      order.status === "CANCELLED_BY_WORKER" ||
      order.status === "CANCELLED_BY_CUSTOMER"
    ) {
      alert("You cannot upload a payment proof for a cancelled order");
      return;
    }
    if (!proofFile) {
      alert("Please choose a screenshot first");
      return;
    }

    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("You must be logged in");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("proof", proofFile);
      formData.append("uploadedBy", userId);

      const res = await fetch(`${API_BASE}/api/orders/${orderId}/bit-proof`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload proof");
      }

      setOrder(data);
      setProofFile(null);
      setSuccessMessage("Payment proof uploaded successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-10 text-center">Order not found</div>;
  }
  const isOrderCancelled =
    order.status === "CANCELLED" ||
    order.status === "CANCELLED_BY_WORKER" ||
    order.status === "CANCELLED_BY_CUSTOMER";

  const canUploadBitProof =
    order.payment_method === "BIT" &&
    order.payment_status === "UNPAID" &&
    !isOrderCancelled;

  return (
    <div className="min-h-screen bg-[#EBF8FB] p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
        <button
          onClick={() => router.back()}
          className="mb-6 rounded-xl border px-4 py-2"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold">Order #{order.id}</h1>

        <div className="mt-6 grid grid-cols-2 gap-4 text-slate-700">
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="font-bold">{order.status}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Amount</p>
            <p className="font-bold">₪{order.amount}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Payment Method</p>
            <p className="font-bold">{order.payment_method}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Payment Status</p>
            <p className="font-bold">{order.payment_status}</p>
          </div>
        </div>

        {canUploadBitProof && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-xl font-bold text-slate-900">
              Upload Bit payment screenshot
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              After paying with Bit, upload the screenshot here so the worker
              can confirm your payment.
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300 bg-white p-6 transition hover:border-cyan-500 hover:bg-cyan-50">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-2 h-10 w-10 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"
                />
              </svg>

              <span className="font-medium text-slate-700">
                Click to upload screenshot
              </span>

              <span className="mt-1 text-sm text-slate-500">
                PNG, JPG, JPEG
              </span>

              {proofFile && (
                <span className="mt-3 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  ✓ {proofFile.name}
                </span>
              )}
            </label>

            <button
              onClick={uploadBitProof}
              disabled={uploading}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:bg-slate-400"
            >
              {uploading ? "Uploading..." : "Upload Screenshot"}
            </button>
          </div>
        )}

        {order.payment_method === "BIT" && isOrderCancelled && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-bold text-red-700">Order Cancelled</h2>

            <p className="mt-2 text-sm text-red-600">
              This order was cancelled. Payment screenshots can no longer be
              uploaded.
            </p>
          </div>
        )}
        {successMessage && (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                ✓
              </div>

              <span className="font-medium">{successMessage}</span>
            </div>

            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {order.payment_method === "BIT" &&
          order.payment_status === "PENDING_VERIFICATION" && (
            <div className="mt-8 rounded-2xl bg-yellow-50 p-5 text-yellow-800">
              Your Bit payment screenshot was uploaded and is waiting for worker
              confirmation.
            </div>
          )}

        {order.payment_status === "PAID" && (
          <div className="mt-8 rounded-2xl bg-green-50 p-5 text-green-700">
            Payment confirmed.
          </div>
        )}

        {order.Rating && (
          <div className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <h2 className="text-xl font-bold text-slate-900">Your Rating</h2>

            <p className="mt-3 text-lg text-yellow-500">
              {"★".repeat(order.Rating.score)}
              {"☆".repeat(5 - order.Rating.score)}
            </p>

            {order.Rating.comment && (
              <p className="mt-3 text-slate-700">{order.Rating.comment}</p>
            )}

            {order.Rating.Photos?.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {order.Rating.Photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={
                      photo.full_image_url
                        ? photo.full_image_url
                        : photo.image_url?.startsWith("http")
                          ? photo.image_url
                          : `${API_BASE}${photo.image_url}`
                    }
                    alt="Rating photo"
                    className="h-40 w-full rounded-xl border object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No photos were uploaded with this rating.
              </p>
            )}
          </div>
        )}

        {!order.Rating && order.status === "COMPLETED" && (
          <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-slate-600">
            No rating submitted for this order yet.
          </div>
        )}
      </div>
    </div>
  );
}
