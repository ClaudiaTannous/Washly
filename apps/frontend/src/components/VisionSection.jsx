"use client";

import { Heart, Leaf, Users } from "lucide-react";

export default function VisionSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">
          Our Mission
        </h2>

        <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto">
          We believe everyone deserves more time for the things they love. Our
          mission is to make laundry effortless, sustainable, and accessible —
          giving you hours back every week to spend with family, pursue hobbies,
          or simply relax.
        </p>

        <div className="grid md:grid-cols-3 gap-10 mt-16">
          {/* Card 1 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">
              Customer First
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Your satisfaction drives everything we do. We're committed to
              delivering quality service that exceeds expectations, every
              single time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">
              Eco-Conscious
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              We use biodegradable detergents, energy-efficient machines, and
              recyclable packaging to minimize our environmental footprint.
            </p>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">
              Community Focused
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              We support local businesses, provide fair wages to our team, and
              partner with charities to donate clean clothes to those in need.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
