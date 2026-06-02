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
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/washly-logo (3).png"
              alt="Washly Logo"
              className="h-10 w-auto"
            />

            <span className="text-slate-700 font-semibold">Washly</span>
          </div>

          <p className="text-sm text-slate-500 mt-2 md:mt-0">
            © 2026 Washly. Fresh laundry, delivered to your door.
          </p>
        </div>
      </footer>
    </div>
  );
}
