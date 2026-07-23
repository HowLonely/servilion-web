"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/date";
import { parseApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  useCleanReception,
  useRegisterDelivery,
} from "@/features/orders/hooks/use-orders";

import type { components } from "@/lib/api/schema";

type LaundryOrderOut = components["schemas"]["LaundryOrderOut"];

// Acciones que corresponden a hitos físicos del flujo y no a transiciones de
// estado: recepción del morral limpio en faena y entrega en habitación. Cada
// una la ejecuta un rol distinto de la operación, así que solo se muestran a
// quien puede hacerlas. (La recepción en lavandería no está aquí: ocurre sola
// al ingresar la guía, no es una acción manual.)
export function OrderFlowActions({ order }: { order: LaundryOrderOut }) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const can = (...roles: string[]) => role === "ADMIN" || roles.includes(role);

  // Repetible: si la guía salió incompleta y la prenda faltante viaja después
  // en un envío aparte, cada llegada física a faena se marca por separado.
  const showCleanReception =
    (order.status === "COMPLETADA" || order.status === "INCOMPLETA") &&
    can("SUPERVISOR");
  const showDelivery =
    order.delivery_flow !== "FLUJO_2" &&
    order.status === "COMPLETADA" &&
    order.clean_receptions.length > 0 &&
    can("SUPERVISOR", "DESPACHO");

  if (!showCleanReception && !showDelivery) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hitos del flujo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showCleanReception && (
          <CleanReceptionAction orderId={order.id} order={order} />
        )}
        {showDelivery && <DeliveryAction orderId={order.id} />}
      </CardContent>
    </Card>
  );
}

function CleanReceptionAction({
  orderId,
  order,
}: {
  orderId: number;
  order: LaundryOrderOut;
}) {
  const [note, setNote] = useState("");
  const mutation = useCleanReception(orderId);
  const hasReceptions = order.clean_receptions.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-72"
          placeholder="Observación (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          disabled={mutation.isPending}
          onClick={async () => {
            try {
              await mutation.mutateAsync({ note });
              setNote("");
              toast.success("Llegada a faena registrada.");
            } catch (error) {
              toast.error(parseApiError(error).detail);
            }
          }}
        >
          {hasReceptions ? "Registrar otra llegada a faena" : "Registrar llegada a faena"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Marca la OT cuando un morral (completo o con la prenda faltante)
        llega a faena desde la lavandería. Se puede repetir si hubo más de un
        envío.
      </p>
      {hasReceptions && (
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {order.clean_receptions.map((reception, index) => (
            <li key={index}>
              {formatDateTime(reception.received_at)}
              {reception.note ? ` · ${reception.note}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeliveryAction({ orderId }: { orderId: number }) {
  const [note, setNote] = useState("");
  const mutation = useRegisterDelivery(orderId);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-72"
          placeholder="Nota de entrega (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          disabled={mutation.isPending}
          onClick={async () => {
            try {
              await mutation.mutateAsync({ note });
              setNote("");
              toast.success("Entrega registrada.");
            } catch (error) {
              toast.error(parseApiError(error).detail);
            }
          }}
        >
          Registrar entrega en habitación
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Normalmente lo registra la app Android del repartidor; desde el panel
        sirve para regularizar entregas que no se pistolearon.
      </p>
    </div>
  );
}
