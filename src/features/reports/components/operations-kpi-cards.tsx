import {
  AlarmClock,
  ArrowDownToLine,
  Boxes,
  Clock,
  Factory,
  Gauge,
  Hourglass,
  MoveDownRight,
  MoveUpRight,
  PackageX,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { components } from "@/lib/api/schema";

type OperationsSummary = components["schemas"]["OperationsSummaryOut"];

// Tono de la métrica: neutro por defecto; ámbar/rojo solo cuando el número
// representa un problema que exige acción (atascadas, incompletos). El color es
// semántico, nunca decorativo (ver dataviz: los tonos de estado son reservados).
type Tone = "neutral" | "warning" | "critical";

const TONE_ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

const TONE_VALUE: Record<Tone, string> = {
  neutral: "text-foreground",
  warning: "text-amber-700 dark:text-amber-300",
  critical: "text-red-700 dark:text-red-300",
};

const nf = new Intl.NumberFormat("es-CL");
const nf1 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

function formatDays(d: number): string {
  return d >= 100 ? `${nf.format(Math.round(d))}` : nf1.format(d);
}

// Variación vs. período anterior. Direccional (flecha) pero cromáticamente
// neutra: "más ingresos" o "menos entregas" no son buenos/malos por sí solos, y
// pintarlos de verde/rojo mentiría. El color semántico se reserva a los tiles de
// problema (atascadas / incompletos).
function DeltaBadge({ pct }: { pct: number | null | undefined }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  const Arrow = up ? MoveUpRight : MoveDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground"
      title="vs. período anterior"
    >
      <Arrow className="size-3" />
      {nf1.format(Math.abs(pct))}%
    </span>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delta,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: number | null;
}) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("size-4 shrink-0", TONE_ICON[tone])} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-semibold tabular-nums tracking-tight",
            TONE_VALUE[tone],
          )}
        >
          {value}
        </span>
        {delta !== undefined && <DeltaBadge pct={delta} />}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function TileSkeleton() {
  return (
    <Card className="gap-0 p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-16" />
      <Skeleton className="mt-2 h-3 w-28" />
    </Card>
  );
}

function Unit({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 text-lg font-normal text-muted-foreground">
      {children}
    </span>
  );
}

export function OperationsKpiCards({
  data,
  isLoading,
}: {
  data: OperationsSummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((row) => (
          <div key={row} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <TileSkeleton key={i} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Turnaround por encima de la meta = señal de atraso en producción.
  const tatOverTarget = data.tat_p50_days > data.tat_target_days;
  const onTimeTone: Tone =
    data.tat_on_target_pct < 60
      ? "critical"
      : data.tat_on_target_pct < 85
        ? "warning"
        : "neutral";

  return (
    <div className="flex flex-col gap-4">
      {/* Fila A — Flujo del período (ritmo de la operación). */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Flujo · últimos {data.period_days} días
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="Ingresadas"
            value={nf.format(data.received)}
            delta={data.received_delta_pct}
            hint="Guías digitalizadas"
            icon={ArrowDownToLine}
          />
          <StatTile
            label="Producidas"
            value={nf.format(data.produced)}
            delta={data.produced_delta_pct}
            hint="Empacadas y despachadas"
            icon={Factory}
          />
          <StatTile
            label="Turnaround"
            value={
              <>
                {formatDays(data.tat_p50_days)}
                <Unit>d</Unit>
              </>
            }
            hint={`Mediana · P90 ${formatDays(data.tat_p90_days)} d · meta ${data.tat_target_days} d`}
            icon={Timer}
            tone={tatOverTarget ? "warning" : "neutral"}
          />
          <StatTile
            label="A tiempo"
            value={
              <>
                {nf1.format(data.tat_on_target_pct)}
                <Unit>%</Unit>
              </>
            }
            hint={`Producidas dentro de ${data.tat_target_days} d`}
            icon={Gauge}
            tone={onTimeTone}
          />
        </div>
      </div>

      {/* Fila B — Foto de planta ahora (excepciones que exigen acción). */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          En planta · ahora
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="En planta"
            value={nf.format(data.in_plant)}
            hint="Trabajo activo (sin despachar)"
            icon={Boxes}
          />
          <StatTile
            label="Atascadas"
            value={nf.format(data.stalled_count)}
            hint="Sobre su umbral de tiempo"
            icon={AlarmClock}
            tone={data.stalled_count > 0 ? "critical" : "neutral"}
          />
          <StatTile
            label="Incompletos abiertos"
            value={nf.format(data.open_incomplete)}
            hint="Prendas faltantes sin resolver"
            icon={PackageX}
            tone={data.open_incomplete > 0 ? "warning" : "neutral"}
          />
          <StatTile
            label="Más antigua"
            value={
              <>
                {formatDays(data.oldest_in_plant_days)}
                <Unit>d</Unit>
              </>
            }
            hint="Guía más vieja en planta"
            icon={Hourglass}
            tone={data.oldest_in_plant_days > 14 ? "warning" : "neutral"}
          />
        </div>
      </div>
    </div>
  );
}
