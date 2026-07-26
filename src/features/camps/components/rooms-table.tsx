"use client";

import { useState } from "react";
import { Printer, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/layout/pagination-bar";
import { parseApiError } from "@/lib/api/errors";
import { CampSelect } from "@/features/camps/components/camp-select";
import { DoorLabel } from "@/features/camps/components/door-label";
import { RoomFormDialog } from "@/features/camps/components/room-form-dialog";
import {
  CAMPS_PAGE_SIZE,
  useRooms,
  useUpdateRoom,
} from "@/features/camps/hooks/use-camps";

import type { components } from "@/lib/api/schema";

type RoomOut = components["schemas"]["RoomOut"];

export function RoomsTable({
  campId,
  onCampChange,
}: {
  campId: number | undefined;
  onCampChange: (campId: number | undefined) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);

  const { data: page, isLoading } = useRooms({
    camp_id: campId,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: CAMPS_PAGE_SIZE,
    offset,
  });
  const rooms = page?.items;
  const total = page?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <CampSelect
          value={campId}
          onChange={(next) => {
            onCampChange(next);
            setOffset(0);
          }}
          placeholder="Todos los campamentos"
          includeAllOption="Todos los campamentos"
          className="w-64"
        />
        <Select
          value={activeFilter}
          onValueChange={(value: string) => {
            setActiveFilter(value);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activas</SelectItem>
            <SelectItem value="false">Inactivas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {campId !== undefined && (
            <PrintLabelsDialog campId={campId} />
          )}
          <RoomFormDialog
            defaultCampId={campId}
            trigger={<Button>Nueva habitación</Button>}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Habitación</TableHead>
              <TableHead>Campamento</TableHead>
              <TableHead>Código QR</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && rooms?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {campId === undefined
                    ? "No hay habitaciones registradas."
                    : "Este campamento aún no tiene habitaciones."}
                </TableCell>
              </TableRow>
            )}
            {rooms?.map((room) => (
              <RoomRow key={room.id} room={room} />
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={CAMPS_PAGE_SIZE}
        total={total}
        itemLabel="habitaciones"
        onOffsetChange={setOffset}
      />
    </div>
  );
}

function RoomRow({ room }: { room: RoomOut }) {
  const updateRoom = useUpdateRoom(room.id);

  async function toggleActive() {
    try {
      await updateRoom.mutateAsync({
        camp_id: room.camp_id,
        number: room.number,
        is_active: !room.is_active,
      });
      toast.success(
        room.is_active ? "Habitación desactivada." : "Habitación activada.",
      );
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium tabular-nums">{room.number}</TableCell>
      <TableCell className="text-muted-foreground">
        {room.camp_name}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {room.qr_code}
      </TableCell>
      <TableCell>
        <Badge variant={room.is_active ? "outline" : "secondary"}>
          {room.is_active ? "Activa" : "Inactiva"}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-1">
        <SingleLabelDialog room={room} />
        <RoomFormDialog
          room={room}
          trigger={
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          }
        />
        <Button variant="ghost" size="sm" onClick={toggleActive}>
          {room.is_active ? "Desactivar" : "Activar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** Etiqueta de una sola puerta, para reponer una que se despegó o se rayó. */
function SingleLabelDialog({ room }: { room: RoomOut }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <QrCode className="size-4" />
          QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader className="print:hidden">
          <DialogTitle>Etiqueta de puerta</DialogTitle>
        </DialogHeader>
        <div className="print-area flex flex-col items-center gap-4">
          <DoorLabel
            numero={room.number}
            campNombre={room.camp_name}
            qrCode={room.qr_code}
          />
          <Button className="w-full print:hidden" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Pliego con todas las etiquetas del camp. Es el caso real: se habilita
 * un campamento y hay que pegar los QR de cientos de puertas de una vez.
 */
function PrintLabelsDialog({ campId }: { campId: number }) {
  const [open, setOpen] = useState(false);
  // Solo activas: no tiene sentido imprimir la etiqueta de una pieza dada de baja.
  const { data: page, isLoading } = useRooms(
    { camp_id: campId, is_active: true, limit: 500 },
    open,
  );
  const rooms = page?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="size-4" />
          Imprimir etiquetas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="print:hidden">
          <DialogTitle>
            Etiquetas de puerta
            {rooms.length > 0 && ` · ${rooms.length} rooms`}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && rooms.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Este camp no tiene rooms activas.
          </p>
        )}

        {rooms.length > 0 && (
          <>
            <Button className="w-fit print:hidden" onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir pliego
            </Button>
            <div className="print-area grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
              {rooms.map((room) => (
                <DoorLabel
                  key={room.id}
                  numero={room.number}
                  campNombre={room.camp_name}
                  qrCode={room.qr_code}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
