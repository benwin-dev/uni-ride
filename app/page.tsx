"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
      return;
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-teal-700">UniRide</span>
          <nav className="flex gap-4 text-sm font-medium text-stone-600">
            <Link href="#how" className="hover:text-teal-600">
              How it works
            </Link>
            <Link href="/login" className="hover:text-teal-600">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
              Turning student trips into{" "}
              <span className="text-teal-600">sustainable rides</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-stone-600 sm:text-xl">
              UniRide helps students find and share rides within their university—reducing
              costs, carbon, and the chaos of group chats.
            </p>
            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-stone-200/80 bg-white px-6 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
              Rides for every situation
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">
              Airport, grocery runs, downtown—share the ride with your campus.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Airport trips", "Grocery runs", "Downtown & events"].map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/50 px-5 py-4 text-stone-800"
                >
                  <span className="text-teal-500" aria-hidden>
                    →
                  </span>
                  <span className="font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how" className="border-t border-stone-200/80 bg-teal-50/30 px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              How UniRide helps
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-700">
              Create rides, browse listings, and join trips—all within your university
              community. Safer than random ride-shares, simpler than WhatsApp.
            </p>
            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Log in to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 bg-stone-100/50 px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-stone-500">
          UniRide – Turning student trips into sustainable rides.
        </div>
      </footer>
    </div>
  );
}
