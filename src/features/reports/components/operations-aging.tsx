import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { components } from "@/lib/api/schema";

type AgingBucket = components["schemas"]["AgingBucket"];

const nf = new Intl.NumberFormat("es-CL");

// Rampa de severidad por antigüedad: fresco (verde) → viejo (rojo). Es una
// escala secuencial-a-diverging deliberada: cuanto más a la derecha, más urgente
// atender la guía. El color es semántico (salud del WIP), no decorativo.
const BUCKET_COLOR = [
  "bg-emerald-500", // 0-1d
  "bg-teal-500", // 1-2d
  "bg-amber-500", // 2-4d
  "bg-orange-500", // 4-7d
  "bg-red-500", // 7d+
];

// Antigüedad del trabajo en planta repartida por tramos. Sustituye a la
// "antigüedad media" (que un puñado de guías zombi del archivo dispara a miles
// de días): la distribución dice DÓNDE está el atasco, no solo un promedio
// engañoso.
export function OperationsAging({
  data,
  isLoading,
}: {
  data: AgingBucket[] | undefined;
  isLoading: boolean;
}) {
  const buckets = data ?? [];
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Antigüedad del WIP en planta</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tiempo en el estado actual · {nf.format(total)} guías activas
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))
          : buckets.map((bucket, i) => {
              const pct = (bucket.count / max) * 100;
              const share = total > 0 ? (bucket.count / total) * 100 : 0;
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {bucket.label}
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-5 flex-1 overflow-hidden rounded-sm bg-muted/40">
                      <div
                        className={cn(
                          "h-full rounded-sm",
                          BUCKET_COLOR[i] ?? "bg-slate-500",
                        )}
                        style={{
                          width: bucket.count === 0 ? 0 : `max(0.5rem, ${pct}%)`,
                        }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
                      {nf.format(bucket.count)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {share.toFixed(0)}%
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
      </CardContent>
    </Card>
  );
}
