"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 🚀 Redirect immediately to the Sign-In page
    router.replace("/signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF8FB] to-[#C7ECF5]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#3AAECF] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-[#1C5D73]">
          Redirecting to Sign In…
        </p>
      </div>
    </div>
  );
}
