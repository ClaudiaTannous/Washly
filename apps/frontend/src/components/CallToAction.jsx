"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CallToAction() {
  const router = useRouter();

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-500 to-cyan-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-6 text-white">
          Ready to Reclaim Your Time?
        </h2>

        <p className="text-lg md:text-xl text-blue-50 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of happy customers who've said goodbye to laundry day.
          Your first pickup is just a few taps away.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push("/signin")}
            className="px-8 py-4 bg-white text-blue-600 rounded-full hover:bg-gray-50 transition-all hover:scale-105 flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-8 text-blue-100 text-sm">
          Cancel anytime • 100% satisfaction guaranteed
        </p>
      </div>
    </section>
  );
}
