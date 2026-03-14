"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    university: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        university: user.university ?? "",
        phone: user.phone ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      university: form.university.trim(),
      phone: form.phone.trim() || undefined,
      bio: form.bio.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-stone-900">Profile</h1>
        <p className="mt-1 text-stone-600">Your campus profile. Only visible in your account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-stone-200/80 bg-white p-6">
          {saved && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Profile saved.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">University email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">University name</label>
            <input
              type="text"
              value={form.university}
              onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              placeholder="e.g. State University"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Short bio or note (optional)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="A bit about you for ride mates"
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700"
          >
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
}
