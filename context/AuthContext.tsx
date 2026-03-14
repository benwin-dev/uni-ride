"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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
  login: (email: string, password: string) => boolean;
  signUp: (data: { name: string; email: string; university: string; password?: string }) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback((email: string, _password: string) => {
    const lower = email.toLowerCase().trim();
    const fromMock = MOCK_USERS.find((u) => u.email.toLowerCase() === lower);
    if (fromMock) {
      setUser({ ...fromMock });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromMock));
      } catch {}
      return true;
    }
    const fromSignedUp = getStoredUsers().find((u) => u.email.toLowerCase() === lower);
    if (fromSignedUp) {
      setUser({ ...fromSignedUp });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fromSignedUp));
      } catch {}
      return true;
    }
    // Demo: allow any university-style email as new user
    if (lower.includes("@") && (lower.endsWith(".edu") || lower.includes("university"))) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: lower.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: lower,
        university: "State University",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(newUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch {}
      return true;
    }
    return false;
  }, []);

  const signUp = useCallback(
    (data: { name: string; email: string; university: string; password?: string }) => {
      const email = data.email.toLowerCase().trim();
      const existing = MOCK_USERS.some((u) => u.email.toLowerCase() === email) ||
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

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
