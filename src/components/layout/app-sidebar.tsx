"use client";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUserCard } from "@/components/layout/sidebar-user-card";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b px-4">
        <BrandMark />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </div>
      <div className="border-t p-3">
        <SidebarUserCard />
      </div>
    </aside>
  );
}
