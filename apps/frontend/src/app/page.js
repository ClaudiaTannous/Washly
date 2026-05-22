import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import HowItWorks from "@/components/HowItWorks";
import VisionSection from "@/components/VisionSection";
import CallToAction from "@/components/CallToAction";

export default function HomePage() {
  return (
    <div className="bg-blue-50">
      <Hero />
      <AboutSection />
      <HowItWorks />
      <VisionSection />
      <CallToAction />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/washly-logo (3).png"
              alt="Washly Logo"
              className="h-32 w-auto"
            />
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 Washly. Fresh laundry, delivered to your door.
          </p>
        </div>
      </footer>
    </div>
  );
}
