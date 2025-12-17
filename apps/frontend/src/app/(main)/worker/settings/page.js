"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkerUpdatePage from "@/components/WorkerUpdatePage";
import { getCurrentUser, getWorker } from "@/lib/apiClient";

export default function WorkerSettingsPage() {
  const router = useRouter();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user?.id) {
          router.replace("/signin");
          return;
        }

        const workerData = await getWorker(user.id);
        setWorker(workerData);
      } catch {
        router.replace("/worker/signup");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  return <WorkerUpdatePage worker={worker} />;
}
