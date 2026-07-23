import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/features/orders/lib/status";

import type { components } from "@/lib/api/schema";

type StatusCount = components["schemas"]["StatusCount"];

const nf = new Intl.NumberFormat("es-CL");

// Embudo operativo: una barra por estado, ancho proporcional al volumen. Usa la
// paleta de estado del sistema (ORDER_STATUS_COLORS, ya validada y consistente
// con las insignias de las tablas), no una paleta categórica nueva.
export function OperationsStatusFunnel({
  data,
  isLoading,
}: {
  data: StatusCount[] | undefined;
  isLoading: boolean;
}) {
  const counts = new Map((data ?? []).map((row) => [row.status, row.count]));
  const max = Math.max(1, ...ORDER_STATUSES.map((s) => counts.get(s) ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución por estado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ORDER_STATUSES.map((status) => {
          const count = counts.get(status) ?? 0;
          const pct = (count / max) * 100;
          const color = ORDER_STATUS_COLORS[status];
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">
                {ORDER_STATUS_LABELS[status]}
              </span>
              <div className="flex flex-1 items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-5 flex-1" />
                ) : (
                  <div className="h-5 flex-1 overflow-hidden rounded-sm bg-muted/40">
                    <div
                      className={cn("h-full rounded-sm", color.dot)}
                      // Un mínimo visible para volúmenes distintos de cero.
                      style={{ width: count === 0 ? 0 : `max(0.5rem, ${pct}%)` }}
                    />
                  </div>
                )}
                <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums">
                  {isLoading ? "" : nf.format(count)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
