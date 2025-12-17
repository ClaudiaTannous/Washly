"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AIAssistant } from "@/components/AIAssistant";
import { getCurrentUser, getWorker } from "@/lib/apiClient";

export default function AIAssistantPage() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();

        if (!user?.id) {
          router.replace("/signin");
          return;
        }

        const worker = await getWorker(user.id);
        setWorkerId(worker.id);
      } catch (err) {
        console.error("Failed to load worker for AI assistant:", err);
        router.replace("/worker/signup");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-600">
        Loading AI Assistant…
      </div>
    );
  }

  return <AIAssistant workerId={workerId} />;
}
