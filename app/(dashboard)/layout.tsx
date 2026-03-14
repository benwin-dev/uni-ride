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
  const { user } = useAuth();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50/80">
      <SideNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
