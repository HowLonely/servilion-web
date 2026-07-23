import { setAccessToken } from "@/lib/auth/token-store";

// Comparte una única promesa de refresh entre requests concurrentes que
// reciben 401 al mismo tiempo, para no disparar múltiples refresh en paralelo.
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) {
      setAccessToken(null);
      return null;
    }
    const data: { access: string } = await res.json();
    setAccessToken(data.access);
    return data.access;
  } catch {
    setAccessToken(null);
    return null;
  }
}
