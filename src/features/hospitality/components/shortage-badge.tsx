import { cn } from "@/lib/utils";
import { SHORTAGE_ALERT_RATE } from "@/features/hospitality/lib/status";

/**
 * Merma de un lote o de una línea.
 *
 * Es el dato propio de hotelería: en una guía de trabajador lo que falta se
 * busca o se repone comprando, y por eso existe el estado Incompleta. Aquí no
 * hay a quién devolverle una sábana en particular —la carga es del campamento—,
 * así que la diferencia entre lo que entró y lo que volvió se asume pérdida y
 * se informa. Distinguir "0" de "sin contar" importa: un lote sin cuenta de
 * salida no tiene merma cero, tiene merma desconocida.
 */
export function ShortageBadge({
  shortage,
  totalIn,
  className,
}: {
  shortage: number | null | undefined;
  totalIn?: number;
  className?: string;
}) {
  if (shortage === null || shortage === undefined) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Sin contar
      </span>
    );
  }

  if (shortage === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
          className,
        )}
      >
        Sin merma
      </span>
    );
  }

  const rate = totalIn && totalIn > 0 ? shortage / totalIn : null;
  const isAlert = rate !== null && rate >= SHORTAGE_ALERT_RATE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        isAlert
          ? "bg-destructive/10 text-destructive"
          : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
        className,
      )}
    >
      −{shortage}
      {rate !== null && <span className="font-normal">({(rate * 100).toFixed(1)}%)</span>}
    </span>
  );
}
