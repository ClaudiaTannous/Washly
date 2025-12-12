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

        // 1️⃣ Identify user (source of truth)
        const user = await getCurrentUser();

        if (!user?.id) {
          router.replace("/signin");
          return;
        }

        // 2️⃣ Must be a worker
        if (user.role !== "worker") {
          router.replace("/worker/signup");
          return;
        }

        // 3️⃣ Load worker profile (same ID as user)
        const workerData = await getWorker(user.id);

        // 4️⃣ Load worker orders
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
      <div className="p-10 text-center text-slate-600">
        Loading worker dashboard…
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
