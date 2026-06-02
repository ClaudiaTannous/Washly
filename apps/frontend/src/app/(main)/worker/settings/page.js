"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkerUpdatePage from "@/components/WorkerUpdatePage";
import { getCurrentUser, getWorker } from "@/lib/apiClient";

export default function WorkerSettingsPage() {
  const router = useRouter();

  const [worker, setWorker] = useState(() => {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem("workerData");
    return cached ? JSON.parse(cached) : null;
  });

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
        localStorage.setItem("workerData", JSON.stringify(workerData));
      } catch {
        router.replace("/worker/signup");
      }
    }

    load();
  }, [router]);

  if (!worker) {
    return null;
  }

  return <WorkerUpdatePage worker={worker} />;
}
