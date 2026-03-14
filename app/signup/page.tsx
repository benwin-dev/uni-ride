"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    university: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = signUp({
      name: form.name.trim(),
      email: form.email.trim(),
      university: form.university.trim(),
      password: form.password || undefined,
    });
    setLoading(false);
    if (ok) {
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 0);
    } else {
      setError("An account with this email already exists. Try logging in instead.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-teal-50/50 flex flex-col">
      <header className="border-b border-emerald-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-teal-700">
            UniRide
          </Link>
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-teal-600">
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
            <p className="mt-1 text-stone-600">Join your campus ride-sharing community.</p>
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

            <label className="block text-sm font-medium text-stone-700">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alex Chen"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />

            <label className="mt-4 block text-sm font-medium text-stone-700">University email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="alex@university.edu"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />

            <label className="mt-4 block text-sm font-medium text-stone-700">University name</label>
            <input
              type="text"
              value={form.university}
              onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              placeholder="State University"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />

            <label className="mt-4 block text-sm font-medium text-stone-700">Password (optional)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>

            <p className="mt-4 text-center text-sm text-stone-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-teal-600 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
