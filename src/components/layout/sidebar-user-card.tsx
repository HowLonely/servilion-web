"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLE_LABELS } from "@/components/layout/nav-config";

export function getInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

/** Tarjeta de usuario del pie del sidebar: avatar de iniciales, nombre, rol y salida. */
export function SidebarUserCard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(user.first_name, user.last_name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user.first_name} {user.last_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {ROLE_LABELS[user.role] ?? user.role}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut />
      </Button>
    </div>
  );
}
