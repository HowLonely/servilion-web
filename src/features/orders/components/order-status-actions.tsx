"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseApiError } from "@/lib/api/errors";
import { useUpdateOrderStatus } from "@/features/orders/hooks/use-orders";
import {
  ORDER_STATUS_LABELS,
  validNextStatuses,
  type OrderStatus,
} from "@/features/orders/lib/status";

export function OrderStatusActions({
  orderId,
  currentStatus,
  deliveryFlow,
}: {
  orderId: number;
  currentStatus: string;
  deliveryFlow: string;
}) {
  // En Flujo 2 no existe la entrega en habitación, así que DESPACHADA es el
  // estado terminal: no hay ningún botón manual siguiente que ofrecer.
  // ENTREGADA se omite a propósito (Flujo 1): la entrega se registra en
  // `OrderFlowActions`, que exige la recepción previa del morral limpio en
  // faena antes de dar por entregado el morral.
  const nextStatuses = validNextStatuses(currentStatus, deliveryFlow).filter(
    (status) => status !== "ENTREGADA",
  );

  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((status) => (
        <StatusTransitionButton
          key={status}
          orderId={orderId}
          targetStatus={status}
        />
      ))}
    </div>
  );
}

function StatusTransitionButton({
  orderId,
  targetStatus,
}: {
  orderId: number;
  targetStatus: OrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const updateStatus = useUpdateOrderStatus(orderId);

  // INCOMPLETA requiere justificar qué faltó o sobró (ver FLUJO_NEGOCIO.md sección 3).
  const requiresNote = targetStatus === "INCOMPLETA";

  async function handleConfirm() {
    try {
      await updateStatus.mutateAsync({ status: targetStatus, note });
      toast.success(`OT marcada como ${ORDER_STATUS_LABELS[targetStatus]}.`);
      setOpen(false);
      setNote("");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  if (!requiresNote) {
    return (
      <Button
        onClick={async () => {
          try {
            await updateStatus.mutateAsync({ status: targetStatus, note: "" });
            toast.success(`OT marcada como ${ORDER_STATUS_LABELS[targetStatus]}.`);
          } catch (error) {
            toast.error(parseApiError(error).detail);
          }
        }}
        disabled={updateStatus.isPending}
      >
        Marcar como {ORDER_STATUS_LABELS[targetStatus]}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Marcar como {ORDER_STATUS_LABELS[targetStatus]}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Marcar OT como {ORDER_STATUS_LABELS[targetStatus]}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Describe qué prenda falta o sobra..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={updateStatus.isPending || note.trim().length === 0}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
