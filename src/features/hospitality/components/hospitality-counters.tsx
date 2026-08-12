"use client";

import { BedDouble, PackageCheck, Scale, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHospitalityCounters } from "@/features/hospitality/hooks/use-hospitality";
import { SHORTAGE_ALERT_RATE } from "@/features/hospitality/lib/status";

/**
 * Indicadores del servicio de hotelería.
 *
 * La merma va primero y en grande a propósito: es lo que el sistema antiguo no
 * podía medir —nueve años de cargas sin un solo registro de faltante— y es el
 * argumento del módulo frente al mandante. Los kilos acompañan porque en
 * hotelería son la magnitud real del trabajo, aunque hoy se cobre por prenda.
 */
export function HospitalityCounters() {
  const { data, isLoading } = useHospitalityCounters();

  if (isLoading) return <Skeleton className="h-28 w-full" />;
  if (!data) return null;

  const rate = data.shortage_rate;
  const isAlert = rate !== null && rate !== undefined && rate >= SHORTAGE_ALERT_RATE;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={TrendingDown}
        label="Merma acumulada"
        value={data.shortage.toLocaleString("es-CL")}
        hint={
          rate !== null && rate !== undefined
            ? `${(rate * 100).toFixed(2)}% de lo contado`
            : "Aún sin lotes contados"
        }
        tone={
          isAlert
            ? "text-destructive bg-destructive/10"
            : "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-400/10"
        }
        emphasis
      />
      <Tile
        icon={BedDouble}
        label="Lotes en planta"
        value={String(data.in_plant)}
        hint={`${data.batches} lotes en total`}
        tone="text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-400/10"
      />
      <Tile
        icon={PackageCheck}
        label="Piezas recibidas"
        value={data.pieces_in.toLocaleString("es-CL")}
        hint={`${data.pieces_out.toLocaleString("es-CL")} devueltas`}
        tone="text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-400/10"
      />
      <Tile
        icon={Scale}
        label="Peso procesado"
        value={
          data.weight_kg !== null && data.weight_kg !== undefined
            ? `${data.weight_kg.toLocaleString("es-CL")} kg`
            : "—"
        }
        hint={`${data.dispatched} lotes despachados`}
        tone="text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-400/10"
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  emphasis,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
  hint: string;
  tone: string;
  emphasis?: boolean;
}) {
  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "leading-tight font-bold tabular-nums",
            emphasis ? "text-3xl" : "text-2xl",
          )}
        >
          {value}
        </p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
    </Card>
  );
}
