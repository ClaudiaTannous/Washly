"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("washly-cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem("washly-cookie-consent", "accepted");
    setVisible(false);
  }

  function declineCookies() {
    localStorage.setItem("washly-cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                    bg-white shadow-xl rounded-xl p-6 max-w-md w-[90%]
                    border border-gray-200">
      <p className="text-gray-700 text-sm mb-4">
        We use cookies to improve your experience and keep you signed in.
      </p>

      <div className="flex gap-3">
        <button
          onClick={acceptCookies}
          className="flex-1 bg-[#3AAECF] text-white py-2 rounded-lg
                     hover:bg-[#2b9bb8] transition"
        >
          Accept
        </button>

        <button
          onClick={declineCookies}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg
                     hover:bg-gray-300 transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
