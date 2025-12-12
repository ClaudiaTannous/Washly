"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIfUserIsWorker } from "../../../../lib/apiClient";

import { WorkerSignupForm } from "@/components/WorkerSignupForm";

export default function WorkerSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function verify() {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.replace("/signin");
        return;
      }

      try {
        const { isWorker } = await checkIfUserIsWorker(userId);

        if (isWorker) {
          // User already has a worker profile → go to dashboard
          router.replace("/worker");
          return;
        }

        // User exists but is NOT a worker → allow signup page
        setAllowed(true);
      } catch (error) {
        console.error("Worker check failed:", error);
      }

      setLoading(false);
    }

    verify();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-600">
        Checking worker status…
      </div>
    );
  }

  if (!allowed) {
    return null; // prevents flash before redirect
  }

  return <WorkerSignupForm />;
}
