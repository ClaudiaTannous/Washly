"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block mb-6">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
            Laundry Made Simple
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 text-gray-900">
          Fresh Clothes,
          <br />
          <span className="text-blue-500">Delivered to You</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Professional laundry service at your fingertips. We pick up, wash,
          fold, and deliver your clothes — so you can focus on what matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => {
              const token = localStorage.getItem("token");
              const userId = localStorage.getItem("userId");

              if (token || userId) {
                router.push("/workers");
              } else {
                router.push("/signin");
              }
            }}
            className="px-8 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all hover:scale-105 flex items-center gap-2"
          >
            Schedule a Pickup
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div>
            <div className="text-3xl mb-2 text-blue-500">24h</div>
            <p className="text-gray-600 text-sm">Fast turnaround</p>
          </div>

          <div>
            <div className="text-3xl mb-2 text-blue-500">100%</div>
            <p className="text-gray-600 text-sm">Satisfaction guaranteed</p>
          </div>

          <div>
            <div className="text-3xl mb-2 text-blue-500">Eco</div>
            <p className="text-gray-600 text-sm">Friendly detergents</p>
          </div>
        </div>
      </div>
    </section>
  );
}
