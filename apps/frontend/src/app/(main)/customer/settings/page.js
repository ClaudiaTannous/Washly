"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/apiClient";
import { UserSettings } from "@/components/UserSettings";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem("currentUser");
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    async function load() {
      try {
        const u = await getCurrentUser();

        setUser(u);
        localStorage.setItem("currentUser", JSON.stringify(u));
      } catch {
        router.replace("/signin");
      }
    }

    load();
  }, [router]);

  if (!user) return null;

  return <UserSettings user={user} onBack={() => router.back()} />;
}
