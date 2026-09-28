"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { parseApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/date";
import {
  useExpressQuota,
  useUpdateWeighingSettings,
  useWeighingSettings,
} from "@/features/weighing/hooks/use-weighing-settings";

/**
 * Cupo mensual de cargos express. Es global para toda la planta: lo consumen
 * todas las básculas y se libera al anular un pesaje express.
 */
export function ExpressQuotaSettings() {
  const settings = useWeighingSettings();
  const quota = useExpressQuota();
  const update = useUpdateWeighingSettings();
  // Borrador del input; null = mostrar el valor guardado. Así el formulario no
  // necesita sincronizarse con la query cuando esta llega o se refresca.
  const [draft, setDraft] = useState<string | null>(null);
  const limit = draft ?? String(settings.data?.express_monthly_limit ?? "");

  const parsed = Number(limit);
  const isValid = limit !== "" && Number.isInteger(parsed) && parsed >= 0;
  const isDirty = settings.data !== undefined && parsed !== settings.data.express_monthly_limit;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    try {
      await update.mutateAsync({ express_monthly_limit: parsed });
      setDraft(null);
      toast.success("Cupo express actualizado");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="size-4 text-amber-500" />
          Cargos express
        </CardTitle>
        <CardDescription>
          Cuántos cargos express se pueden pesar por mes calendario en toda la planta. El cambio
          rige de inmediato para el mes en curso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">Usados este mes</p>
          {quota.data ? (
            <p className="text-2xl font-semibold tabular-nums">
              {quota.data.used}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {quota.data.limit} · quedan {quota.data.remaining}
              </span>
            </p>
          ) : (
            <Skeleton className="mt-1 h-8 w-40" />
          )}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="express-monthly-limit">Límite mensual</FieldLabel>
            <Input
              id="express-monthly-limit"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={limit}
              disabled={settings.isLoading}
              onChange={(event) => setDraft(event.target.value)}
              className="max-w-40"
            />
            <FieldDescription>
              {settings.data?.updated_by_name
                ? `Última modificación: ${formatDateTime(settings.data.updated_at)} por ${settings.data.updated_by_name}.`
                : "Valor inicial: 300 cargos al mes."}
            </FieldDescription>
          </Field>

          <div>
            <Button type="submit" disabled={!isValid || !isDirty || update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
