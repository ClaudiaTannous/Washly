"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/apiClient";
import { UserSettings } from "@/components/UserSettings";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch {
        router.replace("/signin");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading…</div>;
  }

  if (!user) return null;

  return <UserSettings user={user} onBack={() => router.back()} />;
}
