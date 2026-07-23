"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  NAV_GROUPS,
  findActiveNavItem,
  isNavItemVisible,
} from "@/components/layout/nav-config";

/**
 * Navegación agrupada por secciones, compartida entre el sidebar de escritorio
 * y el drawer móvil. `onNavigate` permite cerrar el drawer al elegir un enlace.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const activeHref = findActiveNavItem(pathname)?.href;

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          isNavItemVisible(item, user?.role),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[0.68rem] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {group.label}
            </p>
            {items.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-sidebar-primary" />
                  )}
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-sidebar-primary"
                        : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
