"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-provider";

// Complementa la guardia optimista de proxy.ts: si la sesión resulta
// inválida una vez restaurada en el cliente, saca al usuario del panel.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Cargando sesión...
      </div>
    );
  }

  return <>{children}</>;
}
