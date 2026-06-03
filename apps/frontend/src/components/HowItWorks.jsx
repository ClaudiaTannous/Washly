"use client";

import {
  Search,
  CalendarCheck,
  Handshake,
  CreditCard,
  Star,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Find a Laundry Helper",
      description:
        "Search workers by city, service type, availability, price per wash, and ratings.",
    },
    {
      icon: CalendarCheck,
      title: "Book Your Laundry Order",
      description:
        "Choose pickup and delivery details, select the number of washes, and confirm your order.",
    },
    {
      icon: Handshake,
      title: "Pickup and Service",
      description:
        "The worker collects your laundry, completes the selected washing services, and updates the order status.",
    },
    {
      icon: CreditCard,
      title: "Pay and Confirm",
      description:
        "Pay with cash or Bit. If you pay with Bit, upload a payment screenshot so the worker can confirm it.",
    },
    {
      icon: Star,
      title: "Rate Your Experience",
      description:
        "After the order is completed, leave a rating, comment, and optional photos to help future customers.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-gray-900">
            How Washly Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Book laundry help from trusted local workers in a few simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
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

                  <h3 className="text-xl mb-3 text-gray-900">{step.title}</h3>

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
