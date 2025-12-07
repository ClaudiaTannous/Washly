"use client";

import React, { useState, useEffect } from "react";
import { CustomerDashboard } from "../components/CustomerDashboard";
import { WorkerDashboard } from "../components/WorkerDashboard";
import WorkerSignupPage from "../components/WorkerSignupPage"; // 👈 make sure this file exists
import { checkIfUserIsWorker } from "../lib/apiClient";

// TODO: later replace with real logged-in user id from auth/JWT
const LOGGED_IN_USER_ID = 1;

function App() {
  const [currentPage, setCurrentPage] = useState("customer-dashboard");
  const [hasWorkerProfile, setHasWorkerProfile] = useState(false);
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // 🔹 On mount: ask backend if this user is also a worker
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await checkIfUserIsWorker(LOGGED_IN_USER_ID);
        // res = { isUser, isWorker, workerData }
        setHasWorkerProfile(!!res.isWorker);
        setWorkerData(res.workerData);
      } catch (err) {
        console.error(err);
        setLoadError(err.message || "Failed to check worker status");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const renderPage = () => {
    // basic loading / error handling
    if (loading) {
      return (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-slate-600">Loading your account…</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-red-600">{loadError}</p>
        </div>
      );
    }

    switch (currentPage) {
      case "customer-dashboard":
        return (
          <div className="relative z-10 min-h-screen py-12">
            <CustomerDashboard
              onNavigateToWorkerDashboard={() =>
                setCurrentPage(
                  hasWorkerProfile ? "worker-dashboard" : "worker-signup"
                )
              }
              isAlsoWorker={hasWorkerProfile}
            />
          </div>
        );

      case "worker-dashboard":
        return (
          <div className="relative z-10 min-h-screen py-12">
            <WorkerDashboard
              onNavigateToCustomerDashboard={() =>
                setCurrentPage("customer-dashboard")
              }
              // optional: pass to WorkerDashboard if you want to use it there
              workerUserId={LOGGED_IN_USER_ID}
              initialWorkerData={workerData}
            />
          </div>
        );

      case "worker-signup":
        return (
          <div className="relative z-10 min-h-screen py-12">
            <WorkerSignupPage
              userId={LOGGED_IN_USER_ID}
              onSignupComplete={(createdWorker) => {
                // after signup: mark user as worker and go to dashboard
                setHasWorkerProfile(true);
                setWorkerData(createdWorker);
                setCurrentPage("worker-dashboard");
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Navigation Bar */}
      <nav className="relative z-20 border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] shadow-md">
                <svg
                  className="h-6 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <span className="text-slate-800">FreshWash</span>
            </div>

            {/* Menu: Customer / Worker */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage("customer-dashboard")}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  currentPage === "customer-dashboard"
                    ? "bg-[#4dd0e1]/20 text-[#26c6da]"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Customer
              </button>

              <button
                onClick={() =>
                  setCurrentPage(
                    hasWorkerProfile ? "worker-dashboard" : "worker-signup"
                  )
                }
                className={`rounded-lg px-4 py-2 transition-colors ${
                  currentPage === "worker-dashboard" ||
                  currentPage === "worker-signup"
                    ? "bg-[#4dd0e1]/20 text-[#26c6da]"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Worker
              </button>
            </div>
          </div>
        </div>
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;
