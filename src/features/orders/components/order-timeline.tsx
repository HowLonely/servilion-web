import { formatDuration, intervalToDuration } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";

import type { components } from "@/lib/api/schema";

type LaundryOrderOut = components["schemas"]["LaundryOrderOut"];

type TimelineEntry = {
  key: string;
  label: string;
  description: string;
  at: string | null | undefined;
  dot: string;
};

function packagingDelayNote(order: LaundryOrderOut): string | null {
  if (!order.incomplete_at || !order.completed_at) return null;
  const duration = intervalToDuration({
    start: new Date(order.incomplete_at),
    end: new Date(order.completed_at),
  });
  const readable = formatDuration(duration, {
    format: ["days", "hours", "minutes"],
    locale: es,
  });
  return `Se cerró incompleta el ${formatDateTime(order.incomplete_at)}; quedó completa ${
    readable || "menos de un minuto"
  } después.`;
}

// Actualizaciones que el sistema registra sobre la guía. No se mezclan con
// los estados internos (RECIBIDA, EN_REVISION, etc.): estos son los hitos que
// se muestran al usuario como historial. "Recepcionado en Faena" es repetible
// —si la guía salió incompleta y la prenda faltante viaja después en un envío
// aparte, cada llegada física queda en su propia fila.
function milestonesOf(order: LaundryOrderOut): TimelineEntry[] {
  const isFlow2 = order.delivery_flow === "FLUJO_2";
  const entries: TimelineEntry[] = [
    {
      key: "laundry",
      label: "Recepcionado en Lavandería",
      description: "Morral con ropa sucia recibido en planta.",
      at: order.laundry_received_at,
      dot: "bg-blue-500",
    },
    {
      key: "packed",
      label: "Empaquetado",
      description:
        packagingDelayNote(order) ?? "Morral limpio validado prenda por prenda.",
      at: order.packed_at,
      dot: "bg-indigo-500",
    },
  ];

  entries.push({
    key: "dispatched",
    label: "Despachado a Faena",
    description: "Morral cerrado, cargado y en tránsito hacia faena.",
    at: order.dispatched_at,
    dot: "bg-sky-500",
  });

  if (order.clean_receptions.length > 0) {
    const multiple = order.clean_receptions.length > 1;
    order.clean_receptions.forEach((reception, index) => {
      entries.push({
        key: `site-clean-${index}`,
        label: multiple
          ? `Recepcionado en Faena · envío ${index + 1}`
          : "Recepcionado en Faena (Ropa Limpia)",
        description:
          reception.note || "Supervisor confirmó la llegada del morral limpio.",
        at: reception.received_at,
        dot: "bg-cyan-500",
      });
    });
  } else {
    entries.push({
      key: "site-clean",
      label: "Recepcionado en Faena (Ropa Limpia)",
      description: "Supervisor confirmó la llegada del morral limpio.",
      at: null,
      dot: "bg-cyan-500",
    });
  }

  if (!isFlow2) {
    entries.push({
      key: "delivered",
      label: "Entregado en Habitación",
      description: "Entrega confirmada al trabajador.",
      at: order.delivered_at,
      dot: "bg-emerald-500",
    });
  }

  return entries;
}

export function OrderTimeline({ order }: { order: LaundryOrderOut }) {
  const milestones = milestonesOf(order);

  return (
    <ol className="flex flex-col">
      {milestones.map((milestone, index) => {
        const reached = Boolean(milestone.at);
        const isLast = index === milestones.length - 1;

        return (
          <li key={milestone.key} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 mt-0.5 size-3 shrink-0 rounded-full",
                  reached
                    ? cn(milestone.dot, "shadow-[0_0_0_3px_var(--color-card)]")
                    : "border-2 border-muted-foreground/25 bg-card",
                )}
              />
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1",
                    reached ? "bg-border" : "bg-border/50",
                  )}
                />
              )}
            </div>
            <div className={cn("flex flex-col gap-0.5", !isLast && "pb-6")}>
              <span className="text-xs font-medium text-muted-foreground">
                {reached ? formatDateTime(milestone.at) : "Pendiente"}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tracking-tight",
                  !reached && "text-muted-foreground",
                )}
              >
                {milestone.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {milestone.description}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
