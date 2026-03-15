"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 0);
      } else {
        setError(
          "Invalid email or password. If the database is not set up, use a university email (e.g. praneetha.chandraprakash@university.edu)."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-teal-50/50 flex flex-col">
      <header className="border-b border-emerald-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-teal-700">
            UniRide
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900">UniRide</h1>
            <p className="mt-1 text-stone-600">Turning student trips into sustainable rides.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm"
          >
            {error && (
              <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />

            <label className="mt-4 block text-sm font-medium text-stone-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>

            <p className="mt-4 text-center text-sm text-stone-500">
              Demo: use any email ending in <strong>@university.edu</strong> or{" "}
              <Link href="/signup" className="font-medium text-teal-600 hover:underline">sign up</Link>.
            </p>
            <p className="mt-2 text-center text-xs text-stone-400">
              Mock users: praneetha.chandraprakash@university.edu, benwin.george@university.edu
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Shared rides mean fewer cars and less carbon. Every trip counts.
          </p>
        </div>
      </main>
    </div>
  );
}
