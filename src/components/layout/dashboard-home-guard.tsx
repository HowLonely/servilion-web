"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-provider";
import { landingPathForRole } from "@/components/layout/nav-config";

/**
 * Saca del Panel a quien no tiene acceso a él.
 *
 * No basta con rutear bien al iniciar sesión: `proxy.ts` manda a "/" a
 * cualquiera que ya tenga cookie de sesión y visite /login, así que un digitador
 * que reabre el navegador aterriza igual en el Panel. Sin esto vería una página
 * con el resumen vacío y un menú lateral sin ninguna opción.
 */
export function DashboardHomeGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  const landing = landingPathForRole(user?.role);
  const allowed = landing === "/";

  useEffect(() => {
    if (status === "authenticated" && !allowed) {
      router.replace(landing);
    }
  }, [status, allowed, landing, router]);

  if (status !== "authenticated" || !allowed) return null;

  return <>{children}</>;
}
