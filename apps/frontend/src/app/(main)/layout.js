"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function MainLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* NAVBAR */}
      <nav className="relative z-20 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* LOGO */}
            <div className="flex items-center gap-4">
            <img
            src="/washly-logo (3).png"
            alt="Washly Logo"
            className="w-20 h-20 object-contain drop-shadow-lg"
            />
            <span className="text-slate-800 font-semibold">Washly</span>
            </div>


            {/* NAV LINKS */}
            <div className="flex gap-2">
              <NavButton href="/" current={pathname === "/"}>
                Home
              </NavButton>

              <NavButton
                href="/customer"
                current={pathname.startsWith("/customer")}
              >
                Customer
              </NavButton>

              <NavButton
                href="/worker"
                current={pathname.startsWith("/worker")}
              >
                Worker
              </NavButton>
            </div>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="relative z-10">{children}</main>
    </div>
  );
}

/* ---------------- NAV BUTTON ---------------- */
function NavButton({ href, current, children }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg transition-colors ${
        current
          ? "bg-[#4dd0e1]/20 text-[#26c6da]"
          : "text-slate-600 hover:bg-white/50"
      }`}
    >
      {children}
    </Link>
  );
}
