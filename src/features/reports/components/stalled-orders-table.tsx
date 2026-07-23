"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/layout/pagination-bar";
import { formatDateTime } from "@/lib/date";
import { OrderNumberLabel } from "@/features/orders/components/order-number-label";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import {
  STALLED_PAGE_SIZE,
  useStalledOrders,
} from "@/features/reports/hooks/use-operations-report";

// Convierte horas a un texto compacto ("2d 5h" / "18h"). Redondea a la baja las
// horas dentro del día para no exagerar el atraso.
function formatAge(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours - days * 24);
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
}

// Cuán por encima del umbral está: colorea el tiempo para jerarquizar la
// atención (ámbar recién pasado el umbral, rojo al doble o más).
function ageTone(hours: number, threshold: number): string {
  const ratio = threshold > 0 ? hours / threshold : 1;
  if (ratio >= 2) return "text-red-700 dark:text-red-300";
  return "text-amber-700 dark:text-amber-300";
}

export function StalledOrdersTable({ companyId }: { companyId?: number }) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useStalledOrders(companyId, offset);

  const rows = data?.items ?? [];
  const total = data?.count ?? 0;

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar las OT atascadas. Reintentando…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Trabajador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Tiempo atascada</TableHead>
              <TableHead>Entrega prometida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Sin OT atascadas. 🎉
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell>
                    <Link
                      href={`/orders/${row.id}`}
                      className="font-medium underline-offset-4 group-hover:underline"
                    >
                      <OrderNumberLabel value={row.order_number} />
                    </Link>
                    {row.reference && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.reference}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{row.company_name}</TableCell>
                  <TableCell className="text-sm">{row.worker_name}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-medium tabular-nums",
                      ageTone(row.age_hours, row.threshold_hours),
                    )}
                    title={`Umbral: ${row.threshold_hours}h`}
                  >
                    {formatAge(row.age_hours)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(row.promised_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > STALLED_PAGE_SIZE && (
        <PaginationBar
          offset={offset}
          pageSize={STALLED_PAGE_SIZE}
          total={total}
          itemLabel="OT"
          onOffsetChange={setOffset}
        />
      )}
    </div>
  );
}
