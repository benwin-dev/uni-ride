"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SideNav } from "@/components/SideNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, authReady } = useAuth();

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, authReady, router]);

  if (!authReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50/50">
        <p className="rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-stone-600 shadow-sm">
          {authReady ? "Redirecting to login…" : "Loading…"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <SideNav />
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-b from-white/60 via-emerald-50/25 to-white/70">{children}</div>
      </main>
    </div>
  );
}
