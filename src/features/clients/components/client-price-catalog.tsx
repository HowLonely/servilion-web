"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  GARMENT_TYPES_SELECT_LIMIT,
  useGarmentTypes,
} from "@/features/garments/hooks/use-garment-types";
import {
  useClientPrices,
  useSetClientPrices,
} from "@/features/clients/hooks/use-clients";

// Editor del catálogo de precios de un cliente: por cada tipo de prenda del
// catálogo se fija el precio con el que se cobran TODAS las empresas del cliente.
// El monto de cada guía se congela al cobrarla, así que cambiar un precio aquí no
// altera guías ya cobradas.
export function ClientPriceCatalog({ clientId }: { clientId: number }) {
  const { data: garmentsPage, isLoading: loadingGarments } = useGarmentTypes({
    is_active: true,
    limit: GARMENT_TYPES_SELECT_LIMIT,
  });
  const { data: prices, isLoading: loadingPrices } = useClientPrices(clientId);
  const setPrices = useSetClientPrices(clientId);

  const [draft, setDraft] = useState<Record<number, string> | null>(null);

  const priceByGarment = useMemo(() => {
    const map = new Map<number, number>();
    prices?.forEach((p) => map.set(p.garment_type_id, p.unit_price));
    return map;
  }, [prices]);

  const garments = garmentsPage?.items;
  const isLoading = loadingGarments || loadingPrices;

  // El borrador arranca desde lo que hay en el catálogo; los tipos sin precio
  // quedan vacíos hasta que el usuario escriba uno.
  const values =
    draft ??
    Object.fromEntries(
      (garments ?? []).map((g) => [
        g.id,
        priceByGarment.has(g.id) ? String(priceByGarment.get(g.id)) : "",
      ]),
    );

  function setValue(garmentId: number, value: string) {
    setDraft({ ...values, [garmentId]: value });
  }

  async function onSave() {
    // Se envían solo las prendas con un precio numérico (upsert); las vacías se
    // omiten para no crear filas de catálogo en cero.
    const payload = Object.entries(values)
      .filter(([, value]) => isNumeric(value))
      .map(([id, value]) => ({ garment_type_id: Number(id), unit_price: Number(value) }));
    try {
      await setPrices.mutateAsync({ prices: payload });
      toast.success("Catálogo de precios actualizado.");
      setDraft(null);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Prenda</TableHead>
              <TableHead className="w-40">Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && garments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay prendas en el catálogo.
                </TableCell>
              </TableRow>
            )}
            {garments?.map((garment) => (
              <TableRow key={garment.id}>
                <TableCell className="font-mono text-xs font-semibold tabular-nums">
                  {garment.code}
                </TableCell>
                <TableCell>{garment.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="—"
                    value={values[garment.id] ?? ""}
                    onChange={(e) => setValue(garment.id, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={setPrices.isPending || draft === null}
        >
          {setPrices.isPending ? "Guardando..." : "Guardar precios"}
        </Button>
      </div>
    </div>
  );
}

function isNumeric(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "" && !Number.isNaN(Number(value));
}
