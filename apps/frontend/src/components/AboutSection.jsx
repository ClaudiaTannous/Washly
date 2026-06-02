"use client";

export default function AboutSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-gray-900">
            About Washly
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We're changing the way people think about laundry
          </p>
        </div>

        {/* Section 1 - Left Aligned */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-20">
          <div className="order-2 md:order-1">
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
              <h3 className="text-2xl md:text-3xl text-blue-700">Who We Are</h3>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              Washly started with a simple idea: laundry doesn't have to be a
              chore. We're a team of innovators who believe your time is
              valuable, and we're here to give it back to you.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Using the same technology that transformed food delivery, we've
              built a seamless service that picks up your dirty laundry and
              returns it fresh, clean, and perfectly folded all without you
              lifting a finger.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <img
              src="/Image1.png"
              alt="Washly delivery handover"
              className="w-full h-64 md:h-96 object-cover object-top rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* Section 2 - Right Aligned */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-20">
          <div>
            <img
              src="Image2.png"
              alt="Washly pickup at customer door"
              className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div>
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-cyan-50 border border-cyan-100 shadow-sm">
              <h3 className="text-2xl md:text-3xl text-green-700">
                Why Washly is Special
              </h3>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              Unlike traditional dry cleaners or laundromats, we come to you.
              Our friendly delivery partners are trained, vetted, and equipped
              to handle your clothes with care.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every load is washed separately, ensuring your clothes get the
              individual attention they deserve. Track your order in real-time,
              communicate directly with your driver, and enjoy transparent
              pricing.
            </p>
          </div>
        </div>

        {/* Section 3 - Left Aligned */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-purple-50 border border-purple-100 shadow-sm">
              <h3 className="text-2xl md:text-3xl text-purple-700">
                What Sets Us Apart
              </h3>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              We're not just washing clothes — we're building trust. Our quality
              guarantee means if you're not 100% satisfied, we'll re-wash your
              items for free or issue a full refund.
            </p>
            <p className="text-gray-600 leading-relaxed">
              With flexible scheduling, same-day service options, and
              subscription plans that save you money, Washly fits seamlessly
              into your lifestyle.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <img
              src="/Image3.png"
              alt="Washly delivery handover"
              className="w-full h-64 md:h-96 object-cover object-top rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
