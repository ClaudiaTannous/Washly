"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function testBackend() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // this calls your backend /healthz endpoint
      const base = API_URL.replace(/\/$/, ""); // remove trailing slash if there is one
      const res = await fetch(`${base}/healthz`, {
        method: "GET",
        credentials: "include", // important later for cookies/JWT
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Washly Frontend</h1>
      <p>This page tests the connection to the backend.</p>

      <button
        onClick={testBackend}
        disabled={loading}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          border: "none",
          background: "#0ea5e9",
          color: "white",
          cursor: "pointer",
        }}
      >
        {loading ? "Contacting backend..." : "Test backend /healthz"}
      </button>

      {error && (
        <p style={{ marginTop: "1rem", color: "red" }}>Error: {error}</p>
      )}

      {result && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#0b1120",
            color: "#e5e7eb",
            borderRadius: "8px",
            maxWidth: "400px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
