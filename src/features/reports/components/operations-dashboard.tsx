"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { dateInputDaysAgo } from "@/lib/date";
import { CompanySelect } from "@/features/companies/components/company-select";
import { OperationsAging } from "@/features/reports/components/operations-aging";
import { OperationsKpiCards } from "@/features/reports/components/operations-kpi-cards";
import { OperationsStatusFunnel } from "@/features/reports/components/operations-status-funnel";
import { OperationsTimeseries } from "@/features/reports/components/operations-timeseries";
import { StalledOrdersTable } from "@/features/reports/components/stalled-orders-table";
import {
  useOperationsSummary,
  useOperationsTimeseries,
} from "@/features/reports/hooks/use-operations-report";

// Indica que los datos se refrescan solos por polling. El punto pulsante + el
// spinner sutil durante cada refetch le dan al operador la señal de "esto está
// vivo" sin ser intrusivo.
function LiveBadge({ isFetching }: { isFetching: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      {isFetching ? "Actualizando…" : "En vivo"}
    </span>
  );
}

// Accesos rápidos de período. `days` es la ventana hacia atrás desde hoy
// (0 = solo hoy). El resumen se calcula comparando dateFrom/dateTo contra lo
// que generaría cada preset, así el botón activo refleja el filtro real
// aunque el usuario haya llegado a él editando los inputs a mano.
const PERIOD_PRESETS = [
  { label: "Hoy", days: 0 },
  { label: "Última semana", days: 6 },
  { label: "Últimos 30 días", days: 29 },
] as const;

const DEFAULT_PRESET_DAYS = 6;

export function OperationsDashboard() {
  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  // El período acota las métricas de FLUJO (ingresadas/producidas/turnaround) y
  // la serie diaria. La foto de planta (en planta, atascadas, aging) es siempre
  // "ahora": la calcula el backend sin filtro de fecha, para no ocultar guías
  // viejas que llevan tiempo estancadas.
  const [dateFrom, setDateFrom] = useState(dateInputDaysAgo(DEFAULT_PRESET_DAYS));
  const [dateTo, setDateTo] = useState(dateInputDaysAgo(0));

  function applyPreset(days: number) {
    setDateFrom(dateInputDaysAgo(days));
    setDateTo(dateInputDaysAgo(0));
  }

  const summary = useOperationsSummary(companyId, dateFrom, dateTo);
  const timeseries = useOperationsTimeseries(companyId, dateFrom, dateTo);

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros: empresa (dimensión principal) + período para flujo y serie. */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-64">
          <Label>Empresa</Label>
          <CompanySelect
            value={companyId}
            onChange={setCompanyId}
            placeholder="Todas las empresas"
            includeAllOption="Todas las empresas"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="period_from">Período desde</Label>
          <Input
            id="period_from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="sm:w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="period_to">Período hasta</Label>
          <Input
            id="period_to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="sm:w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Accesos rápidos</Label>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map((preset) => {
              const isActive =
                dateFrom === dateInputDaysAgo(preset.days) &&
                dateTo === dateInputDaysAgo(0);
              return (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className={cn(!isActive && "text-muted-foreground")}
                  onClick={() => applyPreset(preset.days)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="sm:ml-auto sm:pb-2.5">
          <LiveBadge isFetching={summary.isFetching} />
        </div>
      </Card>

      <OperationsKpiCards data={summary.data} isLoading={summary.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OperationsTimeseries
          data={timeseries.data}
          isLoading={timeseries.isLoading}
        />
        <OperationsAging
          data={summary.data?.aging}
          isLoading={summary.isLoading}
        />
      </div>

      <OperationsStatusFunnel
        data={summary.data?.by_status}
        isLoading={summary.isLoading}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          OT atascadas en planta
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            requieren atención
          </span>
        </h2>
        <StalledOrdersTable companyId={companyId} />
      </div>
    </div>
  );
}
