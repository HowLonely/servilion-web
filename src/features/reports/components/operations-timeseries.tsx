import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { components } from "@/lib/api/schema";

type Timeseries = components["schemas"]["TimeseriesOut"];
type Point = components["schemas"]["TimeseriesPoint"];

// Geometría del lienzo (viewBox); el SVG escala al ancho del contenedor.
const W = 800;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 26, left: 36 };

const SERIES = [
  { key: "received" as const, label: "Recibidas", stroke: "stroke-blue-600 dark:stroke-blue-400", fill: "bg-blue-600 dark:bg-blue-400" },
  { key: "delivered" as const, label: "Entregadas", stroke: "stroke-amber-600 dark:stroke-amber-400", fill: "bg-amber-600 dark:bg-amber-400" },
];

function shortDate(iso: string): string {
  // "2026-07-20" -> "20-07"
  return `${iso.slice(8, 10)}-${iso.slice(5, 7)}`;
}

function buildPath(points: Point[], key: "received" | "delivered", max: number): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  return points
    .map((p, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - (p[key] / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function OperationsTimeseries({
  data,
  isLoading,
}: {
  data: Timeseries | undefined;
  isLoading: boolean;
}) {
  const points = data?.points ?? [];
  const max = Math.max(1, ...points.flatMap((p) => [p.received, p.delivered]));
  const innerH = H - PAD.top - PAD.bottom;
  const step = points.length > 1 ? (W - PAD.left - PAD.right) / (points.length - 1) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Ingreso vs. entrega diaria</CardTitle>
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", s.fill)} />
              {s.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : points.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Sin datos en el período seleccionado.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-56 w-full"
            role="img"
            aria-label="Serie diaria de OT recibidas y entregadas"
          >
            {/* Grilla horizontal recesiva + etiquetas del eje Y (0, medio, max). */}
            {[0, 0.5, 1].map((t) => {
              const y = PAD.top + innerH - t * innerH;
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={y}
                    y2={y}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {Math.round(t * max)}
                  </text>
                </g>
              );
            })}

            {/* Líneas de datos: 2px, sin relleno. */}
            {SERIES.map((s) => (
              <path
                key={s.key}
                d={buildPath(points, s.key, max)}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={s.stroke}
              />
            ))}

            {/* Puntos con tooltip nativo por día (capa de hover mínima). */}
            {SERIES.map((s) =>
              points.map((p, i) => {
                const x = PAD.left + i * step;
                const y = PAD.top + innerH - (p[s.key] / max) * innerH;
                return (
                  <circle
                    key={`${s.key}-${i}`}
                    cx={x}
                    cy={y}
                    r={6}
                    className="fill-transparent"
                  >
                    <title>
                      {shortDate(p.date)} · {s.label}: {p[s.key]}
                    </title>
                  </circle>
                );
              }),
            )}

            {/* Etiquetas del eje X: primera, media y última fecha. */}
            {[0, Math.floor((points.length - 1) / 2), points.length - 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((i) => (
                <text
                  key={i}
                  x={PAD.left + i * step}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {shortDate(points[i].date)}
                </text>
              ))}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}
