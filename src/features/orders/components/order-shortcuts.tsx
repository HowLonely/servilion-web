import Link from "next/link";
import {
  ArrowRight,
  PackageCheck,
  PackageX,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Accesos a los estados del flujo que conviene seguir desde el panel. La
// operación de planta (digitalizar, empacar, despachar) se hace en la terminal
// Servilion Desktop contra el servidor local; el panel web la consulta.
const SHORTCUTS = [
  {
    href: "/orders?status=INCOMPLETA",
    icon: PackageX,
    tone: "text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-400/10",
    title: "Morrales incompletos",
    description:
      "OT con prendas faltantes, que se resuelven en la terminal de empaque.",
  },
  {
    href: "/orders?status=COMPLETADA",
    icon: PackageCheck,
    tone: "text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-400/10",
    title: "Pendientes de despacho",
    description:
      "Morrales cerrados que siguen en planta, esperando el camión.",
  },
  {
    href: "/orders?status=DESPACHADA",
    icon: Warehouse,
    tone: "text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-400/10",
    title: "Pendientes de llegada a faena",
    description:
      "Morrales ya despachados; confirma en la OT cuando llegan a faena.",
  },
];

export function OrderShortcuts() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SHORTCUTS.map(({ href, icon: Icon, tone, title, description }) => (
        <Link
          key={href}
          href={href}
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="group/shortcut h-full gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  tone,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-sm font-semibold">{title}</h3>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/shortcut:translate-x-0.5 group-hover/shortcut:text-foreground" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
