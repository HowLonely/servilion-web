import {
  AlarmClock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Clock,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { components } from "@/lib/api/schema";

type OperationsSummary = components["schemas"]["OperationsSummaryOut"];

// Tono de la métrica: neutro por defecto; ámbar/rojo solo cuando el número
// representa un problema que exige acción (atascadas, riesgo de atraso). El
// color es semántico, nunca decorativo (ver dataviz: los status son reservados).
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

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("size-4 shrink-0", TONE_ICON[tone])} />
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", TONE_VALUE[tone])}>
        {value}
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

const nf = new Intl.NumberFormat("es-CL");

export function OperationsKpiCards({
  data,
  isLoading,
}: {
  data: OperationsSummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatTile
        label="En proceso"
        value={nf.format(data.wip_total)}
        hint="OT sin entregar ni cobrar"
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
        label="En riesgo"
        value={nf.format(data.at_risk_count)}
        hint="Entrega prometida < 24 h"
        icon={TriangleAlert}
        tone={data.at_risk_count > 0 ? "warning" : "neutral"}
      />
      <StatTile
        label="Antigüedad media"
        value={
          <>
            {data.avg_wip_age_days.toLocaleString("es-CL", {
              maximumFractionDigits: 1,
            })}
            <span className="ml-1 text-lg font-normal text-muted-foreground">d</span>
          </>
        }
        hint="Del trabajo en proceso"
        icon={Clock}
      />
      <StatTile
        label="Hoy"
        value={
          <span className="flex items-baseline gap-2">
            <span className="inline-flex items-center gap-1">
              <ArrowDownToLine className="size-4 text-muted-foreground" />
              {nf.format(data.received_today)}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpFromLine className="size-4 text-muted-foreground" />
              {nf.format(data.delivered_today)}
            </span>
          </span>
        }
        hint="Recibidas / entregadas"
        icon={ArrowDownToLine}
      />
    </div>
  );
}
