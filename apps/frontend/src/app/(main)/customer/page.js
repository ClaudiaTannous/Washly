"use client";

import { useRouter } from "next/navigation";
import { CustomerDashboard } from "../../../components/CustomerDashboard";

export default function Customer() {
  const router = useRouter();

  return (
    <CustomerDashboard
      onNavigateToSearch={() => router.push("/workers")}
      onNavigateToWorkerDashboard={() => router.push("/worker")}
    />
  );
}
