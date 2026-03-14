"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/rides/create", label: "Create Ride" },
  { href: "/rides/request", label: "Request Ride" },
  { href: "/rides/my-rides", label: "My Rides" },
  { href: "/profile", label: "Profile" },
];

export function SideNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-56 flex-col border-r border-stone-200/80 bg-white">
      <div className="flex h-14 items-center border-b border-stone-200/80 px-5">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-teal-700">
          UniRide
        </Link>
      </div>
      <p className="px-5 py-2 text-xs font-medium uppercase tracking-wider text-stone-400">
        Menu
      </p>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stone-200/80 p-3">
        <p className="truncate px-3 py-1 text-xs text-stone-500">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
