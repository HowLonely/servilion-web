"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ClientSelect } from "@/features/clients/components/client-select";
import { CampFormDialog } from "@/features/camps/components/camp-form-dialog";
import {
  CAMPS_PAGE_SIZE,
  useCamps,
  useUpdateCamp,
} from "@/features/camps/hooks/use-camps";

import type { components } from "@/lib/api/schema";

type CampOut = components["schemas"]["CampOut"];

export function CampsTable({
  onVerRooms,
}: {
  /** Salta a la pestaña de habitaciones ya filtrada por este camp. */
  onVerRooms: (campId: number) => void;
}) {
  const [faenaId, setFaenaId] = useState<number | undefined>();
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);

  const { data: page, isLoading } = useCamps({
    faena_id: faenaId,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: CAMPS_PAGE_SIZE,
    offset,
  });
  const camps = page?.items;
  const total = page?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-56">
          <ClientSelect
            value={faenaId}
            onChange={(next) => {
              setFaenaId(next);
              setOffset(0);
            }}
            placeholder="Todos los clientes"
            includeAllOption="Todos los clientes"
          />
        </div>
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
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <CampFormDialog trigger={<Button>Nuevo campamento</Button>} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Habitaciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-56" />
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
            {!isLoading && camps?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay camps registrados.
                </TableCell>
              </TableRow>
            )}
            {camps?.map((camp) => (
              <CampRow
                key={camp.id}
                camp={camp}
                onVerRooms={onVerRooms}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={CAMPS_PAGE_SIZE}
        total={total}
        itemLabel="campamentos"
        onOffsetChange={setOffset}
      />
    </div>
  );
}

function CampRow({
  camp,
  onVerRooms,
}: {
  camp: CampOut;
  onVerRooms: (campId: number) => void;
}) {
  const updateCamp = useUpdateCamp(camp.id);

  async function toggleActive() {
    try {
      await updateCamp.mutateAsync({
        faena_id: camp.faena_id,
        name: camp.name,
        is_active: !camp.is_active,
      });
      toast.success(
        camp.is_active ? "Campamento desactivado." : "Campamento activado.",
      );
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{camp.name}</TableCell>
      <TableCell className="text-muted-foreground">{camp.faena_name}</TableCell>
      <TableCell className="text-right tabular-nums">
        {camp.rooms_count}
      </TableCell>
      <TableCell>
        <Badge variant={camp.is_active ? "outline" : "secondary"}>
          {camp.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onVerRooms(camp.id)}>
          Habitaciones
        </Button>
        <CampFormDialog
          camp={camp}
          trigger={
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          }
        />
        <Button variant="ghost" size="sm" onClick={toggleActive}>
          {camp.is_active ? "Desactivar" : "Activar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
