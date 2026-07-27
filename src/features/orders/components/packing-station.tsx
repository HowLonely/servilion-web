"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PackageSearch, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-provider";
import { OrderNumberLabel } from "@/features/orders/components/order-number-label";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { PackingPanel } from "@/features/orders/components/packing-panel";
import { useFindOrderByCode } from "@/features/orders/hooks/use-orders";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/lib/status";

import type { components } from "@/lib/api/schema";

type LaundryOrderOut = components["schemas"]["LaundryOrderOut"];

// Estaciones del empaque: el morral solo se puede validar mientras está en
// planta (post-digitalización y antes de despacharse). Coincide con las etapas
// en que `PackingPanel` habilita el pistoleo.
const PACKING_STAGES = ["RECIBIDA", "EN_REVISION", "INCOMPLETA"];
const PACKING_ROLES = ["ADMIN", "LAVANDERIA", "DESPACHO"];

/**
 * Estación de empaque y revisión (paso 6 del flujo). Como la vista de
 * digitalización, está pensada como terminal de escaneo: la mano no sale del
 * teclado y todo se muestra en grande. Se escanea el ref/OT de cualquier prenda
 * del morral para abrirlo, y luego se pistolea prenda por prenda.
 */
export function PackingStation() {
  const { user } = useAuth();
  const canPack = PACKING_ROLES.includes(user?.role ?? "");

  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<LaundryOrderOut | null>(null);
  const lookup = useFindOrderByCode();

  async function handleScan() {
    const value = code.trim();
    if (!value) return;
    try {
      const found = await lookup.mutateAsync(value);
      setOrder(found);
      setCode("");
      // No se refoca aquí: el panel de empaque toma el foco para pistolear.
    } catch (error) {
      toast.error(parseApiError(error).detail);
      inputRef.current?.focus();
    }
  }

  const isPackingStage = order ? PACKING_STAGES.includes(order.status) : false;

  return (
    <div className="flex flex-col gap-6">
      {/* Abrir morral */}
      <Card className="p-5">
        <label
          htmlFor="morral-code"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <ScanLine className="size-5 text-primary" />
          Abrir morral
        </label>
        <div className="mt-2 flex flex-wrap items-stretch gap-2">
          <Input
            id="morral-code"
            ref={inputRef}
            autoFocus
            className="h-14 min-w-64 flex-1 font-mono text-2xl uppercase tracking-wide"
            placeholder="Escanea el ref, la OT o el control…"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScan();
              }
            }}
          />
          <Button
            size="lg"
            className="h-14 px-6 text-lg"
            onClick={handleScan}
            disabled={lookup.isPending}
          >
            Abrir morral
          </Button>
          {order && (
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-5 text-lg"
              onClick={() => {
                setOrder(null);
                setCode("");
                inputRef.current?.focus();
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          El QR de la etiqueta lavable de cada prenda lleva el ref de la OT.
          Escanea cualquier prenda para abrir su morral.
        </p>
      </Card>

      {!canPack && (
        <p className="text-base text-muted-foreground">
          Tu rol no puede validar el empaque. Esta estación es para Lavandería y
          Despacho.
        </p>
      )}

      {order && (
        <>
          {/* Cabecera de la guía abierta */}
          <Card className="flex flex-row flex-wrap items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  OT <OrderNumberLabel value={order.order_number} />
                </h2>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                {order.worker_name} · {order.company_name} · Ref{" "}
                <span className="font-mono font-semibold">
                  {order.reference || "—"}
                </span>{" "}
                · {order.garment_count} prendas
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/orders/${order.id}`}>Ver OT completa</Link>
            </Button>
          </Card>

          {canPack && isPackingStage ? (
            <PackingPanel order={order} />
          ) : canPack ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-6 text-base text-muted-foreground">
                <PackageSearch className="size-6 shrink-0" />
                <span>
                  Esta OT está en estado{" "}
                  <strong>
                    {ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                      order.status}
                  </strong>
                  , fuera de la etapa de empaque. Solo se puede validar mientras
                  el morral está en planta (Recibida, En revisión o Despachada
                  incompleta).
                </span>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
