"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderCounters } from "@/features/orders/hooks/use-orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/features/orders/lib/status";

// Los conteos se piden agregados al backend (`/orders/counters`) en vez de
// contarlos en el cliente: el listado está paginado y el histórico ronda las
// 280.000 guías.
export function OrderStatusSummary() {
  const { data: counters, isLoading } = useOrderCounters();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">OT por estado</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona un estado para ver el listado filtrado.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {ORDER_STATUSES.map((status) => {
          const color = ORDER_STATUS_COLORS[status];
          return (
            <Link
              key={status}
              href={`/orders?status=${status}`}
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card
                size="sm"
                className="h-full gap-2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", color.dot)}
                  />
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <span className="text-2xl font-semibold tabular-nums">
                    {(counters?.by_status[status] ?? 0).toLocaleString("es-CL")}
                  </span>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
