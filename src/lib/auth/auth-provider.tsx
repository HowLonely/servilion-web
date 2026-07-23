"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "@/lib/api/client";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { setAccessToken } from "@/lib/auth/token-store";

import type { components } from "@/lib/api/schema";

type UserOut = components["schemas"]["UserOut"];
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: UserOut | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        setStatus("unauthenticated");
        return;
      }
      const { data, error } = await api.GET("/api/auth/me");
      if (cancelled) return;
      if (error || !data) {
        setStatus("unauthenticated");
        return;
      }
      setUser(data);
      setStatus("authenticated");
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    setAccessToken(data.access);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
