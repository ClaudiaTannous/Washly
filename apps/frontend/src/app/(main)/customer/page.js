"use client";

import { CustomerDashboard } from "../../../components/CustomerDashboard";

export default function Customer() {
  return (
    <CustomerDashboard
      onNavigateToSearch={() => (window.location.href = "/search")}
      onNavigateToWorkerDashboard={() =>
        (window.location.href = "/WorkerDashboard")
      }
    />
  );
}
