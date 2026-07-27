"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/date";
import { OrderFlowActions } from "@/features/orders/components/order-flow-actions";
import { OrderItemsTable } from "@/features/orders/components/order-items-table";
import { OrderNumberLabel } from "@/features/orders/components/order-number-label";
import { OrderPhoto } from "@/features/orders/components/order-photo";
import { OrderStatusActions } from "@/features/orders/components/order-status-actions";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { PackingPanel } from "@/features/orders/components/packing-panel";
import { useOrder } from "@/features/orders/hooks/use-orders";
import { DELIVERY_FLOW_LABELS, type DeliveryFlow } from "@/features/orders/lib/status";
import { useWorker } from "@/features/workers/hooks/use-workers";

export function OrderDetailView({ orderId }: { orderId: number }) {
  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: worker } = useWorker(order?.worker_id);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !order) {
    return (
      <p className="text-destructive">No se pudo cargar la OT solicitada.</p>
    );
  }

  const flowLabel =
    DELIVERY_FLOW_LABELS[order.delivery_flow as DeliveryFlow] ??
    order.delivery_flow;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            OT <OrderNumberLabel value={order.order_number} />
          </h1>
          <p className="text-sm text-muted-foreground">
            Ref: {order.reference || "—"} · Control: {order.control_code || "—"} ·
            Ticket: {order.ticket_number || "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            Digitalizada el {formatDateTime(order.received_at)} · Entrega
            tentativa: {formatDateTime(order.promised_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{flowLabel}</Badge>
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}/receipt`}>
              <Printer className="size-4" />
              Boleta
            </Link>
          </Button>
        </div>
      </div>

      <OrderStatusActions
        orderId={order.id}
        currentStatus={order.status}
        deliveryFlow={order.delivery_flow}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Trabajador</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.worker_name}</p>
              <p className="text-muted-foreground">
                {/* Cuando el cliente coincide con la empresa (caso 1:1) no se
                    repite el nombre; si el cliente agrupa varias empresas, se
                    muestran ambos. */}
                {order.client_name === order.company_name
                  ? order.company_name
                  : `Cliente: ${order.client_name} · Empresa: ${order.company_name}`}{" "}
                · RUT: {worker?.national_id || "—"} · Código:{" "}
                {worker?.badge_code ?? "—"} · Campamento:{" "}
                {order.camp_name || "—"} · Pieza:{" "}
                {order.room_number || "—"} · Turno: {order.shift || "—"}
              </p>
              {order.observations && (
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  Observaciones: {order.observations}
                </p>
              )}
            </CardContent>
          </Card>

          <PackingPanel order={order} />
          <OrderFlowActions order={order} />

          <Card>
            <CardHeader>
              <CardTitle>Detalle de prendas</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
              {order.weight_kg !== null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Peso del morral: {order.weight_kg} kg
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidencia fotográfica</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderPhoto orderId={order.id} photoUrl={order.photo_url} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline order={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
