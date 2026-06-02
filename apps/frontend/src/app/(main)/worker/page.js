"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkerDashboard } from "@/components/WorkerDashboard";
import { getCurrentUser, getWorker, getWorkerOrders } from "@/lib/apiClient";

export default function WorkerDashboardPage() {
  const router = useRouter();

  const [worker, setWorker] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const user = await getCurrentUser();

        if (!user?.id) {
          router.replace("/signin");
          return;
        }

        if (user.role !== "worker") {
          router.replace("/worker/signup");
          return;
        }

        const workerData = await getWorker(user.id);

        const workerOrders = await getWorkerOrders(user.id);

        setWorker(workerData);
        setOrders(workerOrders || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load worker dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="flex justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/70 animate-pulse" />

              <div>
                <div className="h-5 w-48 rounded-full bg-white/80 animate-pulse mb-3" />
                <div className="h-4 w-64 rounded-full bg-white/70 animate-pulse" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-28 rounded-xl bg-white/70 animate-pulse" />
              <div className="h-10 w-10 rounded-xl bg-white/70 animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-white/70 animate-pulse" />
            </div>
          </div>

          {/* About card skeleton */}
          <div className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 mb-10 animate-pulse">
            <div className="h-6 w-40 rounded-full bg-slate-100 mb-4" />
            <div className="h-4 w-full rounded-full bg-slate-100 mb-3" />
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          </div>

          {/* Summary skeleton */}
          <div className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }

  return (
    <WorkerDashboard
      worker={worker}
      orders={orders}
      onNavigateToCustomerDashboard={() => router.push("/customer")}
    />
  );
}
