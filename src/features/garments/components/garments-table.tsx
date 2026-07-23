"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiError } from "@/lib/api/errors";
import { PaginationBar } from "@/components/layout/pagination-bar";
import { GarmentFormDialog } from "@/features/garments/components/garment-form-dialog";
import {
  GARMENT_TYPES_PAGE_SIZE,
  useGarmentTypes,
  useUpdateGarmentType,
} from "@/features/garments/hooks/use-garment-types";

export function GarmentsTable() {
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);
  const { data: page, isLoading } = useGarmentTypes({
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: GARMENT_TYPES_PAGE_SIZE,
    offset,
  });
  const garments = page?.items;
  const total = page?.count ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
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
        <GarmentFormDialog trigger={<Button>Nueva prenda</Button>} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && garments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No se encontraron prendas.
                </TableCell>
              </TableRow>
            )}
            {garments?.map((garment) => (
              <GarmentRow key={garment.id} garment={garment} />
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={GARMENT_TYPES_PAGE_SIZE}
        total={total}
        itemLabel="prendas"
        onOffsetChange={setOffset}
      />
    </div>
  );
}

function GarmentRow({
  garment,
}: {
  garment: NonNullable<ReturnType<typeof useGarmentTypes>["data"]>["items"][number];
}) {
  const updateGarment = useUpdateGarmentType(garment.id);

  async function toggleActive() {
    try {
      await updateGarment.mutateAsync({ ...garment, is_active: !garment.is_active });
      toast.success(garment.is_active ? "Prenda desactivada." : "Prenda activada.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{garment.code}</TableCell>
      <TableCell>{garment.name}</TableCell>
      <TableCell>
        <Badge variant={garment.is_active ? "outline" : "secondary"}>
          {garment.is_active ? "Activa" : "Inactiva"}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-1">
        <GarmentFormDialog
          garment={garment}
          trigger={
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          }
        />
        <Button variant="ghost" size="sm" onClick={toggleActive}>
          {garment.is_active ? "Desactivar" : "Activar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
