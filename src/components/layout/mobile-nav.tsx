"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUserCard } from "@/components/layout/sidebar-user-card";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex h-16 items-center border-b px-4">
          <BrandMark />
        </div>
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SheetDescription className="sr-only">
          Accesos a las secciones de Servilion
        </SheetDescription>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t p-3">
          <SidebarUserCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
