"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      title="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Los íconos se alternan por CSS según la clase `.dark` del <html>,
          así no hay desajuste de hidratación ni estado en un efecto. */}
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
