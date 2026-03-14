"use client";

import { AuthProvider } from "@/context/AuthContext";
import { RidesProvider } from "@/context/RidesContext";
import { RideRequestsProvider } from "@/context/RideRequestsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RidesProvider>
        <RideRequestsProvider>{children}</RideRequestsProvider>
      </RidesProvider>
    </AuthProvider>
  );
}
