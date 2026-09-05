"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  hasWorkspace,
  landingPathForRole,
  ROLE_LABELS,
} from "@/components/layout/nav-config";

/**
 * Saca del Panel a quien no tiene acceso a él.
 *
 * No basta con rutear bien al iniciar sesión: `proxy.ts` manda a "/" a
 * cualquiera que ya tenga cookie de sesión y visite /login, así que un digitador
 * que reabre el navegador aterriza igual en el Panel. Sin esto vería una página
 * con el resumen vacío y un menú lateral sin ninguna opción.
 *
 * Hay dos casos distintos y no uno: quien tiene su estación en otra ruta se
 * redirige a ella, y quien no tiene ninguna pantalla acá —hoy solo `PESAJE`, que
 * trabaja frente a la balanza— se queda con un mensaje que lo dice. Redirigirlo
 * a "/" en bucle o dejarlo mirando un Panel que solo devuelve 403 son las dos
 * formas de no contestarle.
 */
export function DashboardHomeGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  const workspace = hasWorkspace(user?.role);
  const landing = landingPathForRole(user?.role);
  const allowed = landing === "/";

  useEffect(() => {
    if (status === "authenticated" && workspace && !allowed) {
      router.replace(landing);
    }
  }, [status, workspace, allowed, landing, router]);

  if (status !== "authenticated") return null;

  if (!workspace) return <NoWorkspaceNotice role={user?.role} />;

  if (!allowed) return null;

  return <>{children}</>;
}

/** El rol existe y autenticó bien; lo que no tiene es pantalla en este panel. */
function NoWorkspaceNotice({ role }: { role: string | undefined }) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MonitorSmartphone className="size-7" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Tu puesto está en la terminal de planta
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {role ? ROLE_LABELS[role] ?? role : "Tu rol"} trabaja en la aplicación
            de escritorio de Antofagasta, no en este panel. Inicia sesión con la
            misma cuenta en la terminal de la estación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
