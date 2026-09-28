"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { parseApiError } from "@/lib/api/errors";
import { useBalances, useRegisterCount } from "@/features/hospitality/hooks/use-hospitality";
import { LOCATION_KINDS } from "@/features/hospitality/lib/movements";

// El lugar se identifica como texto para el <Select>: el id del campamento, o
// este valor para la bodega de faena (que no es un campamento).
const FAENA = "faena";

/**
 * Conteo de inventario de un lugar: carga inicial y reajustes en una sola
 * operación.
 *
 * Lo tecleado es lo que hay físicamente; el sistema registra la diferencia con
 * lo que creía y deja el saldo en lo contado. Los tipos que se dejan en blanco
 * no se tocan: contar solo las sábanas no pone las toallas en cero. Un 0 sí es
 * un conteo: "aquí no hay ninguna".
 */
export function LinenCountForm({
  initialCompanyId,
  initialLocation,
}: {
  initialCompanyId?: number;
  initialLocation?: string;
}) {
  const router = useRouter();
  const { data: balances, isLoading } = useBalances();
  const registerCount = useRegisterCount();

  const [companyId, setCompanyId] = useState<number | null>(initialCompanyId ?? null);
  const [location, setLocation] = useState<string>(initialLocation ?? "");
  const [counted, setCounted] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");

  if (isLoading) return <Skeleton className="h-72 w-full max-w-3xl" />;

  const companies = balances ?? [];
  const company =
    companies.find((item) => item.company_id === companyId) ??
    (companies.length === 1 ? companies[0] : undefined);

  if (companies.length === 0) {
    return (
      <Card className="max-w-3xl p-5 text-sm text-muted-foreground">
        No hay empresas con contrato de hotelería.
      </Card>
    );
  }

  const camps = company?.locations.filter((row) => row.kind === LOCATION_KINDS.CAMP) ?? [];
  const selectedRow = company?.locations.find((row) =>
    location === FAENA
      ? row.kind === LOCATION_KINDS.FAENA
      : row.kind === LOCATION_KINDS.CAMP && String(row.camp_id) === location,
  );
  const currentOf = (garmentTypeId: number): number =>
    selectedRow?.lines.find((line) => line.garment_type_id === garmentTypeId)?.quantity ?? 0;

  const entered = Object.entries(counted).filter(([, value]) => value !== "");
  const canSubmit = company !== undefined && selectedRow !== undefined && entered.length > 0;

  async function submit() {
    if (!company || !selectedRow) return;
    try {
      await registerCount.mutateAsync({
        company_id: company.company_id,
        camp_id: location === FAENA ? null : Number(location),
        note,
        lines: entered.map(([garmentTypeId, value]) => ({
          garment_type_id: Number(garmentTypeId),
          counted: Number(value),
        })),
      });
      toast.success(`Conteo de ${selectedRow.name} registrado.`);
      router.push("/hospitality");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Cliente</label>
          <Select
            value={company ? String(company.company_id) : ""}
            onValueChange={(value: string) => {
              setCompanyId(Number(value));
              setLocation("");
              setCounted({});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Elige un cliente" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((item) => (
                <SelectItem key={item.company_id} value={String(item.company_id)}>
                  {item.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Lugar contado</label>
          <Select
            value={location}
            disabled={!company}
            onValueChange={(value: string) => {
              setLocation(value);
              setCounted({});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Elige un campamento o la bodega" />
            </SelectTrigger>
            <SelectContent>
              {camps.map((row) => (
                <SelectItem key={row.camp_id} value={String(row.camp_id)}>
                  {row.name}
                </SelectItem>
              ))}
              <SelectItem value={FAENA}>Bodega de faena (por repartir)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {company && selectedRow && (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Lencería</span>
            <span className="w-24 text-right">En el sistema</span>
            <span className="w-28 text-center">Contado</span>
            <span className="w-20 text-right">Ajuste</span>
          </div>
          {company.linen_types.map((type, index) => {
            const value = counted[type.id] ?? "";
            const current = currentOf(type.id);
            const difference = value === "" ? null : Number(value) - current;
            return (
              <div
                key={type.id}
                className={cn(
                  "grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-2.5",
                  index > 0 && "border-t",
                )}
              >
                <span className="font-medium">
                  {type.name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{type.code}</span>
                </span>
                <span
                  className={cn(
                    "w-24 text-right tabular-nums",
                    current < 0 && "font-semibold text-destructive",
                  )}
                >
                  {current.toLocaleString("es-CL")}
                </span>
                <Input
                  className="w-28 text-center font-semibold tabular-nums"
                  inputMode="numeric"
                  placeholder="—"
                  aria-label={`Contado de ${type.name}`}
                  value={value}
                  onChange={(event) =>
                    setCounted((previous) => ({
                      ...previous,
                      [type.id]: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                />
                <span
                  className={cn(
                    "w-20 text-right text-sm tabular-nums",
                    difference === null || difference === 0
                      ? "text-muted-foreground"
                      : difference < 0
                        ? "text-destructive"
                        : "text-emerald-600",
                  )}
                >
                  {difference === null ? "—" : `${difference > 0 ? "+" : ""}${difference}`}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {company && selectedRow && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="count-note" className="text-sm font-medium">
            Observaciones
          </label>
          <Textarea
            id="count-note"
            placeholder="Ej. carga inicial, conteo mensual, sábanas dadas de baja…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          disabled={!canSubmit || registerCount.isPending}
          onClick={() => void submit()}
        >
          {registerCount.isPending && <Loader2 className="animate-spin" />}
          Registrar conteo
        </Button>
        <p className="text-xs text-muted-foreground">
          Deja en blanco los tipos que no contaste: esos no cambian. El saldo de cada tipo contado
          queda en lo que ingresaste.
        </p>
      </div>
    </div>
  );
}
