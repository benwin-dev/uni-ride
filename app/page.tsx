"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  { label: "Airport trips", icon: "✈️", delay: "0ms" },
  { label: "Campus & classes", icon: "🎓", delay: "80ms" },
  { label: "Grocery runs", icon: "🛒", delay: "160ms" },
  { label: "Downtown & events", icon: "🎉", delay: "240ms" },
] as const;

const STEPS = [
  "Create rides",
  "Browse listings",
  "Join trips",
] as const;

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
    <div className="min-h-screen bg-transparent text-stone-900 overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-emerald-200/60 bg-white/90 shadow-[0_1px_0_0_rgba(52,211,153,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-emerald-700">
            UniRide
          </span>
          <nav className="flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50/50 px-1 py-1 text-sm font-medium text-stone-600">
            <Link
              href="#how"
              className="rounded-full px-4 py-2 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm"
            >
              How it works
            </Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-emerald-200/50"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero - tighter spacing to reduce empty space */}
        <section className="relative px-6 py-12 md:py-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl animate-blob"
              aria-hidden
            />
            <div
              className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl animate-blob"
              style={{ animationDelay: "2s" }}
              aria-hidden
            />
            <div
              className="absolute bottom-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-200/25 blur-3xl animate-blob"
              style={{ animationDelay: "4s" }}
              aria-hidden
            />
            <svg
              className="absolute bottom-[18%] left-0 right-0 h-3 opacity-30"
              aria-hidden
            >
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="url(#road-gradient)"
                strokeWidth="2"
                strokeDasharray="12 12"
                style={{ animation: "road-dash 0.8s linear infinite" }}
              />
              <defs>
                <linearGradient id="road-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="rgb(52, 211, 153)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative mx-auto max-w-4xl">
            <h1
              className="animate-fade-in-up text-center text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl md:text-6xl"
              style={{ animationDelay: "0ms" }}
            >
              Turning student trips into{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent animate-gradient-drift bg-[length:200%_auto]">
                  sustainable rides
                </span>
              </span>
            </h1>
            <p
              className="mt-4 animate-fade-in-up text-center text-lg leading-relaxed text-stone-600 sm:text-xl"
              style={{ animationDelay: "80ms" }}
            >
              UniRide helps students find and share rides within their university - reducing
              costs, carbon, and the chaos of group chats.
            </p>
            <div
              className="mt-6 flex animate-fade-in-up justify-center"
              style={{ animationDelay: "160ms" }}
            >
              <Link
                href="/login"
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-200/40 transition hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300/30 hover:-translate-y-0.5"
              >
                Get started
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Wavy divider */}
        <div className="relative h-12 w-full overflow-hidden md:h-16" aria-hidden>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40 Q360 0 720 40 T1440 40 V80 H0 Z"
              fill="rgba(255,255,255,0.8)"
            />
            <path
              d="M0 50 Q360 10 720 50 T1440 50 V80 H0 Z"
              fill="rgba(255,255,255,0.5)"
            />
          </svg>
        </div>

        {/* Features - bento */}
        <section className="relative bg-white/80 px-6 py-16 md:py-20">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
              Rides for every situation
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">
              Airport, campus, grocery runs, downtown - share the ride with your campus.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ label, icon, delay }) => (
                <li
                  key={label}
                  className="card-glow animate-scale-in flex items-center gap-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 to-white px-6 py-5 text-stone-800 shadow-sm transition duration-300 hover:-translate-y-2 hover:-rotate-1 hover:scale-[1.02] hover:border-emerald-200/80 hover:shadow-xl hover:shadow-emerald-100/40"
                  style={{ animationDelay: delay, transform: "rotate(0.5deg)" }}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-inner"
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="font-semibold">{label}</span>
                </li>
              ))}
            </div>
          </div>
        </section>

        {/* Wavy into how */}
        <div className="relative h-12 w-full overflow-hidden md:h-16" aria-hidden>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 H1440 V0 Q1080 40 720 40 T0 40 V0 Z"
              fill="rgb(236 253 245)"
            />
          </svg>
        </div>

        {/* How */}
        <section
          id="how"
          className="relative bg-gradient-to-b from-emerald-50/50 to-emerald-50/10 px-6 py-16 md:py-20"
        >
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/80 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              How it works
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-stone-900 sm:text-3xl">
              How UniRide helps
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-700">
              Create rides, browse listings, and join trips - all within your university
              community. Safer than random ride-shares, simpler than WhatsApp.
            </p>
            {/* Step pills */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {STEPS.map((step, i) => (
                <span
                  key={step}
                  className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-emerald-100/80"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  {step}
                </span>
              ))}
            </div>
            <div
              className="mt-10 animate-fade-in-up"
              style={{ animationDelay: "440ms" }}
            >
              <Link
                href="/login"
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200/40 transition hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300/30 hover:-translate-y-0.5"
              >
                Log in to dashboard
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with wave */}
      <footer className="relative mt-0 px-6 pb-8 pt-12">
        <div className="absolute inset-x-0 top-0 h-12 w-full overflow-hidden md:h-14" aria-hidden>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 56"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 28 Q360 0 720 28 T1440 28 V56 H0 Z"
              fill="rgb(236 253 245)"
            />
          </svg>
        </div>
        <div className="relative mx-auto max-w-5xl text-center text-sm text-stone-500">
          UniRide – Turning student trips into sustainable rides.
        </div>
      </footer>
    </div>
  );
}
