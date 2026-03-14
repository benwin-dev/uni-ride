"use client";

import { AuthProvider } from "@/context/AuthContext";
import { RidesProvider } from "@/context/RidesContext";
import { RideRequestsProvider } from "@/context/RideRequestsContext";
import { ChatProvider } from "@/context/ChatContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RidesProvider>
        <RideRequestsProvider>
          <ChatProvider>{children}</ChatProvider>
        </RideRequestsProvider>
      </RidesProvider>
    </AuthProvider>
  );
}
