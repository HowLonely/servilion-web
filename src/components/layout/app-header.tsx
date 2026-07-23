"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  ROLE_LABELS,
  findActiveNavItem,
} from "@/components/layout/nav-config";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getInitials } from "@/components/layout/sidebar-user-card";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">
            {active?.label ?? "Servilion"}
          </h1>
          {active?.description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {active.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:pr-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user.first_name, user.last_name)}
                </span>
                <span className="hidden text-left leading-tight sm:flex sm:flex-col">
                  <span className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
