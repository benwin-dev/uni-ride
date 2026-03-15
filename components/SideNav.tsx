"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/matching", label: "Matching" },
  { href: "/rides/create", label: "Create Ride" },
  { href: "/rides/request", label: "Request Ride" },
  { href: "/rides/my-rides", label: "My Rides" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "Profile" },
];

export function SideNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-emerald-200/70 bg-white/90 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between border-b border-emerald-100 px-5">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-emerald-700">
          UniRide
        </Link>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Eco
        </span>
      </div>
      <p className="px-5 py-2 text-xs font-medium uppercase tracking-wider text-stone-500">
        Menu
      </p>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-sm"
                  : "text-stone-600 hover:bg-emerald-50/60 hover:text-stone-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-emerald-100 p-3">
        {user && (
          <div className="mb-2 rounded-lg bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              CO₂ saved
            </p>
            <p className="text-lg font-bold text-emerald-800">
              {Number((user.totalCO2SavedKg ?? 0).toFixed(1))} kg
            </p>
            <p className="text-xs text-stone-500">by sharing rides</p>
          </div>
        )}
        <p className="truncate rounded-md bg-emerald-50/70 px-3 py-1.5 text-xs text-stone-600">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-600 hover:bg-emerald-50 hover:text-stone-900"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
