"use client";

import { Menu, User, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MainLayout({ children, currentPath = "/" }) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          {/* TOP BAR */}
          <div className="flex items-center justify-between h-20">
            {/* LOGO */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <img
                src="/washly-logo (3).png"
                alt="Washly Logo"
                className="w-25 h-20 object-contain"
              />
              <span className="text-[#26c6da] text-xl hidden sm:block">
                Washly
              </span>
            </div>

            {/* RIGHT NAVIGATION */}
            <div className="flex items-center gap-4 min-w-[200px] justify-end">
              <div className="hidden lg:flex items-center gap-1">
                <NavLink href="/" current={currentPath === "/"}>
                  Home
                </NavLink>

                <NavLink
                  href="/customer"
                  current={currentPath.startsWith("/customer")}
                >
                  Customer
                </NavLink>

                <NavLink
                  href="/worker"
                  current={currentPath.startsWith("/worker")}
                >
                  Worker
                </NavLink>

                <NavLink
                  href="/workers"
                  current={currentPath.startsWith("/workers")}
                >
                  Search
                </NavLink>
              </div>

              {/* USER MENU */}
              <button className="flex items-center gap-3 px-3 py-2 rounded-full border border-gray-300 hover:shadow-md transition-shadow">
                <Menu className="size-4" />
                <div className="bg-gray-600 text-white rounded-full p-1.5">
                  <User className="size-4" />
                </div>
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH BUTTON */}
          <div className="md:hidden pb-4">
            <button
              onClick={() => router.push("/workers")}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 hover:text-[#26c6da]"
            >
              <Search className="size-5" />
              Search
            </button>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="pt-20">{children}</main>
    </div>
  );
}

/* ---------------- NAV LINK ---------------- */
function NavLink({ href, current, children }) {
  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-full text-sm font-normal transition-colors ${
        current
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-[#26c6da]"
      }`}
    >
      {children}
    </a>
  );
}
