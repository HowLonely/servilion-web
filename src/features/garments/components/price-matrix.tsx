"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceMatrix } from "@/features/garments/hooks/use-price-matrix";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function PriceMatrix() {
  const { data, isLoading, isError } = usePriceMatrix();
  const [search, setSearch] = useState("");
  // Por defecto se ocultan los clientes sin ningún precio cargado: el catálogo
  // legado dejó decenas de clientes vacíos que solo generan columnas en blanco.
  const [onlyWithPrices, setOnlyWithPrices] = useState(true);

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const rows = useMemo(() => data?.rows ?? [], [data]);

  // Clientes que tienen al menos un precio definido en alguna prenda.
  const clientsWithPrices = useMemo(() => {
    const set = new Set<number>();
    for (const row of rows) {
      for (const cell of row.prices) {
        if (cell.unit_price != null) set.add(cell.client_id);
      }
    }
    return set;
  }, [rows]);

  const visibleClients = useMemo(
    () =>
      onlyWithPrices
        ? clients.filter((c) => clientsWithPrices.has(c.id))
        : clients,
    [clients, clientsWithPrices, onlyWithPrices],
  );

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar la comparativa de precios.
      </p>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const hiddenCount = clients.length - visibleClients.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:w-72">
          <Label htmlFor="garment_search">Buscar prenda</Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="garment_search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o código"
              className="pl-8"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyWithPrices}
            onChange={(e) => setOnlyWithPrices(e.target.checked)}
            className="size-4 accent-primary"
          />
          Solo clientes con precios
          {onlyWithPrices && hiddenCount > 0 && (
            <span className="text-xs">({hiddenCount} ocultos)</span>
          )}
        </label>
      </div>

      {visibleClients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún cliente tiene precios cargados todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-10 min-w-52 bg-muted/40 px-3 py-2 text-left font-medium backdrop-blur">
                  Prenda
                </th>
                {visibleClients.map((client) => (
                  <th
                    key={client.id}
                    className="min-w-28 px-3 py-2 text-right font-medium whitespace-nowrap"
                    title={client.name}
                  >
                    {client.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleClients.length + 1}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    No se encontraron prendas.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <PriceRow
                    key={row.garment_type_id}
                    row={row}
                    visibleClients={visibleClients}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <span className="mr-3">
          <span className="mr-1 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
          precio más bajo
        </span>
        <span className="mr-3">
          <span className="mr-1 inline-block size-2 rounded-full bg-amber-500 align-middle" />
          precio más alto
        </span>
        <span>— celda vacía = sin precio definido para ese cliente.</span>
      </p>
    </div>
  );
}

type MatrixRow = NonNullable<
  ReturnType<typeof usePriceMatrix>["data"]
>["rows"][number];
type MatrixClient = NonNullable<
  ReturnType<typeof usePriceMatrix>["data"]
>["clients"][number];

function PriceRow({
  row,
  visibleClients,
}: {
  row: MatrixRow;
  visibleClients: MatrixClient[];
}) {
  const priceByClient = new Map(
    row.prices.map((cell) => [cell.client_id, cell.unit_price]),
  );

  // Min/max sobre los precios definidos y visibles, para resaltar la comparación.
  // Solo tiene sentido si hay al menos dos precios distintos en la fila.
  const values = visibleClients
    .map((c) => priceByClient.get(c.id))
    .filter((v): v is number => v != null);
  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;
  const hasSpread = min != null && max != null && min !== max;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="sticky left-0 z-10 bg-background px-3 py-2 backdrop-blur">
        <div className="font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.code}</div>
      </td>
      {visibleClients.map((client) => {
        const price = priceByClient.get(client.id) ?? null;
        const isMin = hasSpread && price === min;
        const isMax = hasSpread && price === max;
        return (
          <td
            key={client.id}
            className={cn(
              "px-3 py-2 text-right tabular-nums",
              price == null && "text-muted-foreground/40",
              isMin && "font-semibold text-emerald-700 dark:text-emerald-300",
              isMax && "font-semibold text-amber-700 dark:text-amber-300",
            )}
          >
            {price == null ? "—" : clp.format(price)}
          </td>
        );
      })}
    </tr>
  );
}
