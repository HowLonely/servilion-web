"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { parseApiError } from "@/lib/api/errors";
import { CampSelect } from "@/features/camps/components/camp-select";
import {
  useCreateRoom,
  useUpdateRoom,
} from "@/features/camps/hooks/use-camps";

import type { components } from "@/lib/api/schema";

type RoomOut = components["schemas"]["RoomOut"];

export function RoomFormDialog({
  room,
  defaultCampId,
  trigger,
}: {
  room?: RoomOut;
  /** Precarga el campamento cuando se crea desde su listado filtrado. */
  defaultCampId?: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(room);

  const [campId, setCampId] = useState<number | undefined>(
    room?.camp_id ?? defaultCampId,
  );
  const [roomNumber, setRoomNumber] = useState(room?.number ?? "");
  const [saving, setSaving] = useState(false);

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom(room?.id ?? -1);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCampId(room?.camp_id ?? defaultCampId);
      setRoomNumber(room?.number ?? "");
    }
    setOpen(nextOpen);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!campId || !roomNumber.trim()) {
      toast.error("Elige un campamento y escribe el número de la habitación.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        camp_id: campId,
        number: roomNumber.trim(),
        is_active: room?.is_active ?? true,
      };
      if (isEdit) {
        await updateRoom.mutateAsync(body);
      } else {
        await createRoom.mutateAsync(body);
      }
      toast.success(
        isEdit
          ? "Habitación actualizada."
          : "Habitación creada. Imprime su QR y pégalo en la puerta.",
      );
      setOpen(false);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar habitación" : "Nueva habitación"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "El código QR no cambia al editar: ya está impreso y pegado en la puerta."
              : "Al crearla, el sistema genera su código QR para pegar en la puerta."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Campamento</FieldLabel>
              <FieldContent>
                {/* Mover una pieza de camp invalidaría el QR ya pegado. */}
                <CampSelect
                  value={campId}
                  onChange={setCampId}
                  className={isEdit ? "pointer-events-none opacity-60" : undefined}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="room-number">Número de habitación</FieldLabel>
              <FieldContent>
                <Input
                  id="room-number"
                  autoFocus
                  placeholder="Ej. 101"
                  value={roomNumber}
                  onChange={(event) => setRoomNumber(event.target.value.toUpperCase())}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear habitación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
