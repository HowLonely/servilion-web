"use client";

import Link from "next/link";
import { BedDouble, ClipboardCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/lib/auth/auth-provider";
import { canManageLinenStock } from "@/components/layout/nav-config";
import { useBalances } from "@/features/hospitality/hooks/use-hospitality";
import { LOCATION_KINDS } from "@/features/hospitality/lib/movements";

import type { components } from "@/lib/api/schema";

type CompanyBalanceOut = components["schemas"]["CompanyBalanceOut"];
type BalanceLocationOut = components["schemas"]["BalanceLocationOut"];

/**
 * Dónde está la lencería de cada cliente de hotelería.
 *
 * Los campamentos van primero porque es el saldo que se gestiona; debajo, la
 * bodega de faena (despachado y todavía sin repartir) y lo que está en poder
 * de Servilion (retirado sucio y todavía sin despachar limpio).
 */
export function LinenBalances() {
  const { data, isLoading, error } = useBalances();

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (error || !data) {
    return <p className="text-destructive">No se pudieron cargar los saldos de lencería.</p>;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <BedDouble className="size-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">No hay empresas con contrato de hotelería</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Marca una empresa con el tipo de servicio &quot;Lencería de hotelería&quot; para
            empezar a controlar su stock.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {data.map((company) => (
        <CompanyBalance key={company.company_id} company={company} />
      ))}
    </div>
  );
}

function CompanyBalance({ company }: { company: CompanyBalanceOut }) {
  const { user } = useAuth();
  const canCount = canManageLinenStock(user?.role);

  const camps = company.locations.filter((row) => row.kind === LOCATION_KINDS.CAMP);
  const faena = company.locations.find((row) => row.kind === LOCATION_KINDS.FAENA);
  const servilion = company.locations.find((row) => row.kind === LOCATION_KINDS.SERVILION);
  const campsTotal = camps.reduce((sum, row) => sum + row.total, 0);
  // Servilion no se cuenta (su saldo sale solo de despachos y retiros), así
  // que su negativo no se corrige con un conteo y no se anuncia como alerta.
  const flagged = [...camps, ...(faena ? [faena] : [])].filter((row) => row.has_negative);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{company.company_name}</h2>
          {company.faena_name && (
            <p className="text-sm text-muted-foreground">{company.faena_name}</p>
          )}
        </div>
        {canCount && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/hospitality/count?company=${company.company_id}`}>
              <ClipboardCheck className="size-4" />
              Conteo de inventario
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          label="En campamentos"
          value={campsTotal}
          hint={`${camps.length} ${camps.length === 1 ? "campamento" : "campamentos"}`}
        />
        <Tile
          label="Por repartir en faena"
          value={faena?.total ?? 0}
          hint="Despachado a la faena y todavía sin repartir"
        />
        <Tile
          label="En poder de Servilion"
          value={servilion?.total ?? 0}
          hint="Retirado sucio y todavía sin despachar limpio"
        />
      </div>

      {flagged.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            <span className="font-semibold">
              {flagged.map((row) => row.name).join(", ")}
            </span>{" "}
            {flagged.length === 1 ? "tiene" : "tienen"} saldo negativo: se registró más
            salida de la que el sistema tenía. Haz un conteo de inventario para
            corregirlo.
          </p>
        </div>
      )}

      {company.linen_types.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">
          No hay tipos de lencería. Marca en{" "}
          <Link href="/garments" className="font-medium underline">
            Prendas
          </Link>{" "}
          los que se usan en hotelería.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lugar</TableHead>
                  {company.linen_types.map((type) => (
                    <TableHead key={type.id} className="text-right" title={type.name}>
                      {type.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Último conteo</TableHead>
                  {canCount && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {camps.map((row) => (
                  <BalanceRow
                    key={`camp-${row.camp_id}`}
                    row={row}
                    companyId={company.company_id}
                    canCount={canCount}
                  />
                ))}
                {faena && (
                  <BalanceRow
                    row={faena}
                    companyId={company.company_id}
                    canCount={canCount}
                    muted
                  />
                )}
                {servilion && (
                  <BalanceRow
                    row={servilion}
                    companyId={company.company_id}
                    canCount={false}
                    reserveCountColumn={canCount}
                    muted
                  />
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </section>
  );
}

function BalanceRow({
  row,
  companyId,
  canCount,
  reserveCountColumn = false,
  muted = false,
}: {
  row: BalanceLocationOut;
  companyId: number;
  canCount: boolean;
  reserveCountColumn?: boolean;
  muted?: boolean;
}) {
  const location = row.camp_id ?? "faena";
  return (
    <TableRow className={cn(muted && "bg-muted/30")}>
      <TableCell className="font-medium">
        <span className="flex items-center gap-1.5">
          {row.has_negative && row.kind !== LOCATION_KINDS.SERVILION && (
            <TriangleAlert className="size-4 text-destructive" />
          )}
          {row.name}
        </span>
      </TableCell>
      {row.lines.map((line) => (
        <TableCell
          key={line.garment_type_id}
          className={cn(
            "text-right tabular-nums",
            line.quantity < 0 && "font-semibold text-destructive",
            line.quantity === 0 && "text-muted-foreground",
          )}
        >
          {line.quantity.toLocaleString("es-CL")}
        </TableCell>
      ))}
      <TableCell className="text-right font-semibold tabular-nums">
        {row.total.toLocaleString("es-CL")}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {row.kind === LOCATION_KINDS.SERVILION
          ? "No se cuenta"
          : row.last_counted_at
            ? formatDate(row.last_counted_at)
            : "Nunca"}
      </TableCell>
      {canCount ? (
        <TableCell>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/hospitality/count?company=${companyId}&location=${location}`}>
              Contar
            </Link>
          </Button>
        </TableCell>
      ) : (
        reserveCountColumn && <TableCell />
      )}
    </TableRow>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          value < 0 && "text-destructive",
        )}
      >
        {value.toLocaleString("es-CL")}
        <span className="ml-1 text-sm font-normal text-muted-foreground">piezas</span>
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
