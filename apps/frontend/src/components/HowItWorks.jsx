"use client";

import { Smartphone, Package, Sparkles, Truck } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      title: "Schedule a Pickup",
      description:
        "Choose a time that works for you through our app or website. Pick a slot as soon as today or plan ahead for the week.",
    },
    {
      icon: Package,
      title: "We Pick Up Your Laundry",
      description:
        "Our friendly driver arrives at your door, collects your dirty clothes in eco-friendly bags, and heads to our facility.",
    },
    {
      icon: Sparkles,
      title: "Professional Cleaning",
      description:
        "Your clothes are washed with premium detergents, dried, and folded with care. Special items? We handle those too.",
    },
    {
      icon: Truck,
      title: "Fresh Delivery",
      description:
        "Within 24 hours, your clean, fresh laundry is delivered right back to your doorstep. It is that simple.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-gray-900">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Four simple steps to cleaner, fresher clothes
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-blue-500" />
                  </div>

                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>

                  <h3 className="text-xl mb-3 text-gray-900">
                    {step.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/3 -right-4 w-8 h-0.5 bg-blue-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
