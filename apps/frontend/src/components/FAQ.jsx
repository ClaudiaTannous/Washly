"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      question: "How does Washly work?",
      answer:
        "Choose a laundry worker, place an order, schedule pickup and delivery, and track your order until it is completed.",
    },
    {
      question: "How do I pay with Bit?",
      answer:
        "After placing an order, transfer the payment using Bit and upload a screenshot so the worker can verify it.",
    },
    {
      question: "Can I choose my worker?",
      answer:
        "Yes. You can browse workers, compare ratings and prices, and choose the one that best fits your needs.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Most orders are completed within 24 hours, depending on the worker's availability.",
    },
    {
      question: "How do ratings work?",
      answer:
        "After an order is completed, customers can leave ratings, comments, and photos describing their experience.",
    },
    {
      question: "What should I do if there is a problem with my order?",
      answer:
        "Contact our support team and we will investigate the issue as quickly as possible.",
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
          FAQ
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-900">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    open === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open === index && (
                <div className="px-6 pb-5 text-slate-600">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
