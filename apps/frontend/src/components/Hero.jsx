"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  function isLoggedIn() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    return Boolean(token || userId);
  }

  function handleFindWorkers() {
    if (!isLoggedIn()) {
      router.push("/signin");
      return;
    }

    router.push("/workers");
  }

  function handleBecomeWorker() {
    if (!isLoggedIn()) {
      router.push("/signin");
      return;
    }

    const isWorker = localStorage.getItem("isWorker");

    if (isWorker === "true") {
      router.push("/worker");
    } else {
      router.push("/worker/signup");
    }
  }

  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#e0f7fa] via-white to-[#f8feff]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <div>
          <span className="inline-flex mb-6 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
            Laundry pickup & delivery near you
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
            Fresh laundry,
            <br />
            <span className="text-[#26c6da]">without leaving home.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
            Book trusted laundry workers near you. Schedule pickup, track your
            order, and get your clothes washed, folded, and delivered back.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleFindWorkers}
              className="px-8 py-4 bg-[#26c6da] text-white rounded-2xl hover:bg-[#1db5c8] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold"
            >
              Find Workers
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleBecomeWorker}
              className="px-8 py-4 bg-white text-slate-700 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-semibold"
            >
              Become a Worker
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#26c6da]" />
              Trusted providers
            </span>

            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#26c6da]" />
              Flexible scheduling
            </span>

            <span className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#26c6da]" />
              Door-to-door service
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative">
          <div className="rounded-[2rem] bg-white p-6 shadow-2xl border border-cyan-100">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-cyan-100 to-blue-50 p-6">
              <div className="rounded-3xl bg-white p-5 shadow-sm mb-4">
                <p className="text-sm text-slate-500">Next pickup</p>
                <p className="text-2xl font-bold text-slate-900">
                  Today, 18:30
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FeatureBox icon={Clock} title="24h" text="Fast turnaround" />
                <FeatureBox
                  icon={CheckCircle}
                  title="100%"
                  text="Easy booking"
                />
                <FeatureBox icon={Truck} title="Pickup" text="From your door" />
                <FeatureBox
                  icon={ShieldCheck}
                  title="Trusted"
                  text="Rated workers"
                />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden md:block rounded-2xl bg-white px-5 py-4 shadow-xl border border-slate-100">
            <p className="text-sm text-slate-500">Order status</p>
            <p className="font-bold text-slate-900">Laundry in progress</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBox({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <Icon className="mb-3 h-6 w-6 text-[#26c6da]" />
      <p className="font-bold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
