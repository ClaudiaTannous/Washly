"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function CustomerOrderDetails() {
  const { orderId } = useParams();
  const router = useRouter();

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
      alert("Payment proof uploaded successfully");
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

        {order.payment_method === "BIT" &&
          order.payment_status === "UNPAID" && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h2 className="text-xl font-bold text-slate-900">
                Upload Bit payment screenshot
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                After paying with Bit, upload the screenshot here so the worker
                can confirm your payment.
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mt-4 block w-full rounded-xl bg-white p-3"
              />

              <button
                onClick={uploadBitProof}
                disabled={uploading}
                className="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:bg-slate-400"
              >
                {uploading ? "Uploading..." : "Upload Screenshot"}
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
      </div>
    </div>
  );
}
