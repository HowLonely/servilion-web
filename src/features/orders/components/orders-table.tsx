"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/layout/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { OrderNumberLabel } from "@/features/orders/components/order-number-label";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import {
  ORDERS_PAGE_SIZE,
  useOrders,
  type OrderFilters,
} from "@/features/orders/hooks/use-orders";

export function OrdersTable({ filters }: { filters: OrderFilters }) {
  const [offset, setOffset] = useState(0);
  const { data: page, isLoading, error } = useOrders({ ...filters, offset });

  const orders = page?.items;
  const total = page?.count ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Trabajador</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Recepción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prendas</TableHead>
              <TableHead>Cobrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-destructive">
                  No se pudieron cargar las OT.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && orders?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No se encontraron OT en el rango seleccionado.
                </TableCell>
              </TableRow>
            )}
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${order.id}`} className="hover:underline">
                    <OrderNumberLabel value={order.order_number} />
                  </Link>
                </TableCell>
                <TableCell>{order.reference || "—"}</TableCell>
                <TableCell>{order.worker_name}</TableCell>
                <TableCell>{order.client_name}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {order.company_name}
                    {order.delivery_flow === "FLUJO_2" && (
                      <Badge variant="outline">Flujo 2</Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>{formatDate(order.received_at)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>{order.garment_count}</TableCell>
                <TableCell>
                  {order.billed_amount !== null
                    ? `$${order.billed_amount.toLocaleString("es-CL")}`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* El listado viene paginado desde el backend: el histórico ronda las
          280.000 guías, así que nunca se traen todas de una vez. */}
      <PaginationBar
        offset={offset}
        pageSize={ORDERS_PAGE_SIZE}
        total={total}
        itemLabel="OT"
        onOffsetChange={setOffset}
      />
    </div>
  );
}
