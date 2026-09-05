"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CAMPS_SELECT_LIMIT,
  ROOMS_SELECT_LIMIT,
  useCamps,
  useRooms,
} from "@/features/camps/hooks/use-camps";

const NONE_VALUE = "__none__";

/**
 * Selector de habitación en dos pasos: primero el campamento, luego la pieza.
 *
 * Un campamento puede tener cientos de piezas, así que nunca se listan todas
 * juntas: la consulta de habitaciones se dispara recién al elegir camp.
 *
 * Reemplaza a los antiguos campos de texto libre `campamento`/`habitación` del trabajador,
 * que permitían escribir el mismo campamento de tres formas distintas y no
 * podían asociarse al QR de la puerta.
 */
export function RoomSelect({
  value,
  onChange,
  faenaId,
  disabled,
  className,
}: {
  value: number | null | undefined;
  onChange: (roomId: number | null) => void;
  /** Acota los campamentos al cliente de la empresa del trabajador. */
  faenaId?: number;
  disabled?: boolean;
  className?: string;
}) {
  const [campId, setCampId] = useState<number | null>(null);

  const { data: campsPage } = useCamps({
    faena_id: faenaId,
    is_active: true,
    limit: CAMPS_SELECT_LIMIT,
  });
  const camps = campsPage?.items ?? [];

  // Al editar un trabajador llega la habitación pero no su campamento: se
  // deduce de la lista para dejar ambos selectores en el estado correcto.
  const { data: roomActual } = useRooms(
    { is_active: true, limit: ROOMS_SELECT_LIMIT },
    campId === null && value != null,
  );
  const selectedRoom = roomActual?.items.find((room) => room.id === value);
  const effectiveCampId = campId ?? selectedRoom?.camp_id ?? null;

  const { data: roomsPage } = useRooms(
    { camp_id: effectiveCampId ?? undefined, is_active: true, limit: ROOMS_SELECT_LIMIT },
    effectiveCampId !== null,
  );
  const rooms = roomsPage?.items ?? [];

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <Select
        disabled={disabled}
        value={effectiveCampId ? String(effectiveCampId) : NONE_VALUE}
        onValueChange={(next: string) => {
          const id = next === NONE_VALUE ? null : Number(next);
          setCampId(id);
          // Cambiar de campamento invalida la pieza elegida: el número 101 de
          // un campamento no es el 101 de otro.
          onChange(null);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Campamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Sin camp</SelectItem>
          {camps.map((camp) => (
            <SelectItem key={camp.id} value={String(camp.id)}>
              {camp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled || effectiveCampId === null}
        value={value ? String(value) : NONE_VALUE}
        onValueChange={(next: string) => onChange(next === NONE_VALUE ? null : Number(next))}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={effectiveCampId === null ? "Elige camp" : "Habitación"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Sin habitación</SelectItem>
          {rooms.map((room) => (
            <SelectItem key={room.id} value={String(room.id)}>
              {room.number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
