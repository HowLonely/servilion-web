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
  /**
   * Texto para cuando el hito no tiene fecha porque NUNCA va a tenerla, no
   * porque esté por ocurrir. Un morral digitalizado sin báscula no tiene el
   * pesaje "pendiente": no pasó por ahí y no va a pasar. Sin esta distinción la
   * línea de tiempo promete un paso que no va a llegar.
   */
  notApplicable?: string;
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
  // Se retiró el hito "Recepcionado en Faena (Ropa Sucia)" (paso 2 del flujo,
  // `order.site_received_at`): ningún cliente llama a
  // `POST /orders/scan/site-reception` que lo llenaría, y hoy no existe un
  // código físico sobre el morral o la OT en blanco para pistolear en ese
  // momento (el adhesivo que documenta FLUJO_NEGOCIO.md §3.2 es una hipótesis
  // sin confirmar, heredada de la app PEÑON del sistema anterior). Mostrarlo
  // como "Pendiente" para siempre —nunca se llena, nunca se va a llenar con
  // las pantallas actuales— era prometer un paso que no existe en la
  // operación real. El campo y el endpoint siguen en el backend por si algún
  // día hay un QR real que pistolear ahí; el día que lo haya, este hito vuelve.
  const entries: TimelineEntry[] = [
    {
      // Paso 4a: el primer momento en que el sistema ve este morral. Ocurre
      // antes de que la guía exista —por eso el dato viene del pesaje y no de
      // un campo propio de la guía— y es lo que explica que el empaque valide
      // por unidad en vez de por tipo de prenda.
      key: "weighed",
      label: "Pesado en Báscula",
      description:
        order.weighed_garment_count !== null
          ? `Morral pesado y etiquetado: ${order.weighed_garment_count} prendas contadas en báscula.`
          : "Morral pesado y etiquetado al llegar a planta.",
      at: order.weighed_at,
      dot: "bg-violet-500",
      // El pesaje solo se enlaza al digitalizar (`consume` corre dentro de
      // `create_order`), así que una guía sin `weigh_in_id` no lo va a tener
      // nunca: no está pendiente, no aplica.
      notApplicable:
        order.weigh_in_id === null
          ? "Se digitalizó sin pasar por la báscula, así que el empaque valida por tipo de prenda y no por unidad."
          : undefined,
    },
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
        // Tres estados y no dos: cumplido, pendiente (todavía puede pasar) y
        // no aplica (no va a pasar nunca). Ver `TimelineEntry.notApplicable`.
        const skipped = !reached && Boolean(milestone.notApplicable);
        const isLast = index === milestones.length - 1;

        return (
          <li key={milestone.key} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 mt-0.5 size-3 shrink-0 rounded-full",
                  reached
                    ? cn(milestone.dot, "shadow-[0_0_0_3px_var(--color-card)]")
                    : skipped
                      // Punteado: se distingue del círculo vacío de "pendiente"
                      // sin necesidad de leer el texto.
                      ? "border-2 border-dashed border-muted-foreground/40 bg-card"
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
                {reached
                  ? formatDateTime(milestone.at)
                  : skipped
                    ? "No aplica"
                    : "Pendiente"}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tracking-tight",
                  !reached && "text-muted-foreground",
                  skipped && "line-through decoration-muted-foreground/40",
                )}
              >
                {milestone.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {skipped ? milestone.notApplicable : milestone.description}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
