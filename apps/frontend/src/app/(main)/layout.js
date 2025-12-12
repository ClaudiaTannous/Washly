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
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold">FreshWash</span>
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
