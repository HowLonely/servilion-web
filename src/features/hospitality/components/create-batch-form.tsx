"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { parseApiError } from "@/lib/api/errors";
import { dateInputDaysAgo, localInputToIsoUtc } from "@/lib/date";
import { CompanyLogo } from "@/features/companies/components/company-logo";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import {
  GARMENT_TYPES_SELECT_LIMIT,
  useGarmentTypes,
} from "@/features/garments/hooks/use-garment-types";
import { useCreateBatch } from "@/features/hospitality/hooks/use-hospitality";

type Line = {
  garment_type_id: number | null;
  custom_name: string;
  quantity_in: number;
  weight_kg: number | null;
};

const MAX_SUGGESTIONS = 8;

/**
 * Recepción de una carga de lencería del campamento.
 *
 * A diferencia de la digitalización de una OT, aquí no hay trabajador, RUT,
 * turno ni habitación: la carga es del campamento y vuelve al mandante. Lo que
 * se registra es qué lencería llegó y cuánta, porque esa cantidad es contra la
 * que se contará la salida para obtener la merma.
 */
export function CreateBatchForm() {
  const router = useRouter();
  const createBatch = useCreateBatch();

  const { data: companiesPage, isLoading: loadingCompanies } = useCompanies({
    is_active: true,
    limit: 200,
  });
  // Solo contratos de hotelería: registrar aquí la ropa de un trabajador sería
  // repetir el error del sistema antiguo (el backend igual lo rechaza).
  const companies = useMemo(
    () =>
      (companiesPage?.items ?? []).filter(
        (company) => company.service_type === "HOTELERIA",
      ),
    [companiesPage],
  );

  const { data: garmentsPage } = useGarmentTypes({
    is_active: true,
    limit: GARMENT_TYPES_SELECT_LIMIT,
  });
  const garments = useMemo(() => garmentsPage?.items ?? [], [garmentsPage]);

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [receivedAt, setReceivedAt] = useState(
    `${dateInputDaysAgo(0)}T${new Date().toTimeString().slice(0, 5)}`,
  );
  const [weightKg, setWeightKg] = useState("");
  const [observations, setObservations] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const queryRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return garments
      .filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          g.code.toLowerCase().includes(term),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [garments, query]);

  const totalPieces = lines.reduce((sum, line) => sum + (line.quantity_in || 0), 0);

  function addCatalogLine(id: number) {
    setLines((current) => {
      if (current.some((line) => line.garment_type_id === id)) {
        toast.info("Esa lencería ya está en el lote.");
        return current;
      }
      return [
        ...current,
        { garment_type_id: id, custom_name: "", quantity_in: 1, weight_kg: null },
      ];
    });
    setQuery("");
    queryRef.current?.focus();
  }

  function addCustomLine() {
    const name = query.trim().toUpperCase();
    if (!name) return;
    setLines((current) => [
      ...current,
      { garment_type_id: null, custom_name: name, quantity_in: 1, weight_kg: null },
    ]);
    setQuery("");
    queryRef.current?.focus();
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  const canSubmit =
    companyId !== null && lines.length > 0 && lines.every((l) => l.quantity_in > 0);

  async function submit() {
    if (!canSubmit) return;
    try {
      const batch = await createBatch.mutateAsync({
        company_id: companyId,
        received_at: localInputToIsoUtc(receivedAt),
        weight_kg: weightKg ? Number(weightKg) : null,
        observations,
        items: lines,
      });
      toast.success(`Lote ${batch.batch_number} recibido.`);
      router.push(`/hospitality/${batch.id}`);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  if (loadingCompanies) return <Skeleton className="h-64 w-full" />;

  if (companies.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <TriangleAlert className="size-10 text-amber-500" />
        <div>
          <p className="font-semibold">
            No hay empresas configuradas como hotelería
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Marca el tipo de servicio como <strong>Hotelería</strong> en la
            empresa que presta este contrato para poder recibir sus cargas.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/companies")}>
          Ir a Empresas
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Empresa de hotelería */}
      <Card className="flex flex-col gap-3 p-5">
        <p className="text-sm font-semibold tracking-tight">
          ¿De qué contrato es la carga?
        </p>
        <div className="flex flex-wrap gap-2">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => setCompanyId(company.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2 pr-3 text-left transition-colors",
                companyId === company.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/60",
              )}
            >
              <CompanyLogo name={company.name} logoUrl={company.logo_url} />
              <span className="text-sm font-semibold">{company.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Lencería recibida */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold tracking-tight">
            ¿Qué lencería llegó?
          </p>
          <p className="text-sm text-muted-foreground">
            {lines.length} tipo{lines.length === 1 ? "" : "s"} ·{" "}
            <span className="text-lg font-bold tabular-nums text-foreground">
              {totalPieces.toLocaleString("es-CL")}
            </span>{" "}
            piezas
          </p>
        </div>

        <div className="relative">
          <Input
            ref={queryRef}
            className="h-12 text-lg"
            placeholder="Escribe sábana, toalla, cortina…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions.length > 0) addCatalogLine(suggestions[0].id);
                else addCustomLine();
              }
            }}
          />
          {query.trim() && (
            <div className="absolute z-10 mt-1 flex w-full flex-col overflow-hidden rounded-xl border bg-popover shadow-md">
              {suggestions.map((garment) => (
                <button
                  key={garment.id}
                  type="button"
                  className="flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => addCatalogLine(garment.id)}
                >
                  <span>{garment.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {garment.code}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="flex items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={addCustomLine}
              >
                <Plus className="size-4" />
                Agregar &quot;{query.trim().toUpperCase()}&quot; fuera de catálogo
              </button>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-hidden rounded-xl border">
            {lines.map((line, index) => {
              const garment = garments.find((g) => g.id === line.garment_type_id);
              return (
                <div
                  key={`${line.garment_type_id ?? line.custom_name}-${index}`}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-3 py-2.5",
                    index > 0 && "border-t",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {garment?.name ?? line.custom_name}
                    {!garment && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Fuera de catálogo
                      </span>
                    )}
                  </span>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    Piezas
                    <Input
                      className="h-10 w-24 text-center text-base font-semibold"
                      type="number"
                      min="1"
                      value={line.quantity_in}
                      onChange={(e) =>
                        updateLine(index, {
                          quantity_in: Math.max(1, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    kg
                    <Input
                      className="h-10 w-24 text-center text-base"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="—"
                      value={line.weight_kg ?? ""}
                      onChange={(e) =>
                        updateLine(index, {
                          weight_kg: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setLines((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Datos de la carga */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Fecha de recepción</span>
            <Input
              type="datetime-local"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Peso total (kg)</span>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej. 609"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Observaciones</span>
          <Textarea
            rows={2}
            placeholder="Estado de la carga, bultos, lo que corresponda…"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </label>
      </Card>

      <Button
        size="lg"
        className="h-12 w-full text-lg sm:w-auto sm:self-start sm:px-8"
        disabled={!canSubmit || createBatch.isPending}
        onClick={submit}
      >
        Recibir carga
      </Button>
    </div>
  );
}
