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
      <div className="flex flex-col h-screen bg-gradient-to-br from-[#e0f7fa] via-white to-white animate-pulse">
        <div className="bg-gradient-to-r from-[#4dd0e1] to-[#26c6da] px-6 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-white/30 rounded-xl" />
            <div>
              <div className="h-6 w-40 bg-white/40 rounded-full mb-2" />
              <div className="h-4 w-56 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-20 w-3/4 rounded-2xl bg-white border" />
            <div className="h-20 w-1/2 rounded-2xl bg-white border ml-auto" />
          </div>
        </div>

        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <div className="h-12 flex-1 rounded-2xl bg-slate-100" />
            <div className="h-12 w-16 rounded-2xl bg-cyan-100" />
          </div>
        </div>
      </div>
    );
  }

  return <AIAssistant workerId={workerId} />;
}
