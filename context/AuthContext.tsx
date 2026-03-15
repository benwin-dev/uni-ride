"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "@/lib/types";
import { MOCK_USERS } from "@/lib/mock-data";

const STORAGE_KEY = "uniride-user";
const USERS_STORAGE_KEY = "uniride-users";

function getStoredUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as User[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

interface AuthContextValue {
  user: User | null;
  /** False until we've read from localStorage (avoids hydration mismatch). */
  authReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (data: { name: string; email: string; university: string; password?: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  /** Add to cumulative CO₂ saved (persists to DB when available, else localStorage). */
  addCO2Saved: (amount: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as User;
    const mock = MOCK_USERS.find((u) => u.id === parsed.id);
    const signedUp = getStoredUsers().find((u) => u.id === parsed.id);
    const found = mock ?? signedUp ?? parsed;
    return { ...found, ...parsed };
  } catch {
    return null;
  }
}

function loginFallback(email: string): User | null {
  const lower = email.toLowerCase().trim();
  const fromMock = MOCK_USERS.find((u) => u.email.toLowerCase() === lower);
  if (fromMock) return { ...fromMock };
  const fromSignedUp = getStoredUsers().find((u) => u.email.toLowerCase() === lower);
  if (fromSignedUp) return { ...fromSignedUp };
  if (lower.includes("@") && (lower.endsWith(".edu") || lower.includes("university"))) {
    return {
      id: `user-${Date.now()}`,
      name: lower.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: lower,
      university: "State University",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setAuthReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      const u = data.user as User;
      setUser(u);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } catch {}
      return true;
    }
    if (res.status === 503) {
      const fallback = loginFallback(email);
      if (fallback) {
        setUser(fallback);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        } catch {}
        return true;
      }
    }
    if (res.status === 401) return false;
    const fallback = loginFallback(email);
    if (fallback) {
      setUser(fallback);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      } catch {}
      return true;
    }
    return false;
  }, []);

  const signUp = useCallback(
    async (data: {
      name: string;
      email: string;
      university: string;
      password?: string;
    }): Promise<boolean> => {
      const email = data.email.toLowerCase().trim();
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email,
          university: data.university.trim(),
          password: data.password || "",
        }),
      });
      const body = await res.json();
      if (res.ok && body.user) {
        const u = body.user as User;
        setUser(u);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        } catch {}
        return true;
      }
      if (res.status === 409) return false;
      if (res.status === 503) {
        const existing =
          MOCK_USERS.some((u) => u.email.toLowerCase() === email) ||
          getStoredUsers().some((u) => u.email.toLowerCase() === email);
        if (existing) return false;
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: data.name.trim(),
          email,
          university: data.university.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const users = getStoredUsers();
        users.push(newUser);
        saveStoredUsers(users);
        setUser(newUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        } catch {}
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, [user]);

  const addCO2Saved = useCallback(
    (amount: number) => {
      if (!user || amount <= 0) return;
      const newTotal = (user.totalCO2SavedKg ?? 0) + amount;
      fetch(`/api/users/${user.id}/add-co2`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
        .then((res) =>
          res.json().then((data: { totalCO2SavedKg?: number }) => ({ ok: res.ok, data }))
        )
        .then(({ ok, data }) => {
          if (ok && typeof data.totalCO2SavedKg === "number") {
            setUser((prev) => {
              if (!prev) return prev;
              const next = {
                ...prev,
                totalCO2SavedKg: data.totalCO2SavedKg,
                updatedAt: new Date().toISOString(),
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
          } else {
            updateProfile({ totalCO2SavedKg: newTotal });
          }
        })
        .catch(() => {
          updateProfile({ totalCO2SavedKg: newTotal });
        });
    },
    [user, updateProfile]
  );

  return (
    <AuthContext.Provider value={{ user, authReady, login, signUp, logout, updateProfile, addCO2Saved }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
