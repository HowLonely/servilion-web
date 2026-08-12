"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Scale, Truck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/date";
import { parseApiError } from "@/lib/api/errors";
import { CompanyLogo } from "@/features/companies/components/company-logo";
import { BatchStatusBadge } from "@/features/hospitality/components/batch-status-badge";
import { ShortageBadge } from "@/features/hospitality/components/shortage-badge";
import {
  useBatch,
  useDispatchBatch,
  useRegisterReturnCount,
} from "@/features/hospitality/hooks/use-hospitality";

import type { components } from "@/lib/api/schema";

type LinenBatchItemOut = components["schemas"]["LinenBatchItemOut"];

/**
 * Detalle de un lote de lencería.
 *
 * El centro de la pantalla es la cuenta de salida: cuántas piezas de cada tipo
 * volvieron del lavado. Es el único control que tiene sentido en hotelería
 * —aquí no se pistolea prenda por prenda como en un morral— y de ahí sale la
 * merma que se le informa al mandante.
 */
export function BatchDetailView({ batchId }: { batchId: number }) {
  const { data: batch, isLoading, error } = useBatch(batchId);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !batch) {
    return <p className="text-destructive">No se pudo cargar el lote.</p>;
  }

  const isDispatched = batch.status === "DESPACHADO";

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo
            name={batch.company_name}
            logoUrl={batch.company_logo_url}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold">
                {batch.batch_number}
              </h1>
              <BatchStatusBadge status={batch.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {batch.company_name}
              {batch.camp_name && ` · ${batch.camp_name}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Recibido el {formatDateTime(batch.received_at)}
              {batch.promised_at &&
                ` · Devolución comprometida: ${formatDateTime(batch.promised_at)}`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hospitality/${batch.id}/note`}>
            <FileText className="size-4" />
            Acta
          </Link>
        </Button>
      </div>

      {/* Resumen de la carga */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Piezas recibidas"
          value={batch.total_in.toLocaleString("es-CL")}
        />
        <SummaryTile
          label="Piezas devueltas"
          value={
            batch.total_out !== null
              ? batch.total_out.toLocaleString("es-CL")
              : "Sin contar"
          }
          muted={batch.total_out === null}
        />
        <Card className="flex flex-col justify-center gap-1 p-4">
          <p className="text-sm text-muted-foreground">Merma</p>
          <ShortageBadge
            shortage={batch.shortage}
            totalIn={batch.total_in}
            className="w-fit text-sm"
          />
        </Card>
      </div>

      {/* `key` por versión del lote: remonta el panel con los valores del
          servidor cuando el lote cambia, en vez de sincronizarlo con un efecto. */}
      <ReturnCountPanel
        key={batch.updated_at}
        batch={batch}
        disabled={isDispatched}
      />

      {batch.weight_kg !== null && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Scale className="size-4" />
          Peso total de la carga: {batch.weight_kg.toLocaleString("es-CL")} kg
        </p>
      )}

      {batch.observations && (
        <Card className="p-4">
          <p className="text-sm font-semibold">Observaciones</p>
          <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
            {batch.observations}
          </p>
        </Card>
      )}

      {isDispatched ? (
        <Card className="flex flex-wrap items-center gap-2 p-4 text-sm">
          <Truck className="size-4 text-emerald-600" />
          Despachado el {formatDateTime(batch.dispatched_at)}
          {batch.received_by_client && (
            <span className="text-muted-foreground">
              · recibido en faena por{" "}
              <strong className="text-foreground">
                {batch.received_by_client}
              </strong>
            </span>
          )}
        </Card>
      ) : (
        <DispatchPanel batchId={batch.id} isCounted={batch.is_counted} />
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Card className="flex flex-col justify-center gap-1 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl leading-tight font-bold tabular-nums",
          muted && "text-base font-medium text-muted-foreground",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

/**
 * Cuenta de salida. Se puede corregir mientras el lote no se despache: contar
 * cientos de sábanas admite equivocarse, y obligar a cerrar el lote para
 * arreglar un número sería peor que permitir recontar.
 */
function ReturnCountPanel({
  batch,
  disabled,
}: {
  batch: components["schemas"]["LinenBatchOut"];
  disabled: boolean;
}) {
  const register = useRegisterReturnCount(batch.id);
  // Inicializado una sola vez desde el servidor. Quien lo resincroniza es el
  // `key` del padre, que remonta este panel cuando el lote cambia de versión:
  // así lo escrito a medio contar no se pisa en cada refetch, y después de
  // guardar sí se refleja lo que quedó registrado.
  const [counts, setCounts] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      batch.items.map((item) => [
        item.id,
        item.quantity_out !== null ? String(item.quantity_out) : "",
      ]),
    ),
  );

  const filled = batch.items.filter(
    (item) => counts[item.id] !== undefined && counts[item.id] !== "",
  );

  async function save() {
    try {
      await register.mutateAsync(
        filled.map((item) => ({
          item_id: item.id,
          quantity_out: Number(counts[item.id]),
        })),
      );
      toast.success("Cuenta de salida guardada.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="text-sm font-semibold tracking-tight">
          Cuenta de salida
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Cuántas piezas de cada tipo volvieron del lavado. La diferencia con lo
          recibido es la merma que se informa al mandante.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {batch.items.map((item, index) => (
          <CountRow
            key={item.id}
            item={item}
            bordered={index > 0}
            value={counts[item.id] ?? ""}
            disabled={disabled}
            onChange={(value) =>
              setCounts((current) => ({ ...current, [item.id]: value }))
            }
          />
        ))}
      </div>

      {!disabled && (
        <Button
          className="w-full sm:w-auto sm:self-start sm:px-8"
          disabled={register.isPending || filled.length === 0}
          onClick={save}
        >
          Guardar cuenta
        </Button>
      )}
    </Card>
  );
}

function CountRow({
  item,
  bordered,
  value,
  disabled,
  onChange,
}: {
  item: LinenBatchItemOut;
  bordered: boolean;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const typed = value === "" ? null : Number(value);
  const shortage = typed === null ? null : item.quantity_in - typed;
  const isOver = typed !== null && typed > item.quantity_in;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 px-3 py-3",
        bordered && "border-t",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
      <span className="shrink-0 text-sm text-muted-foreground">
        Entraron{" "}
        <strong className="text-base text-foreground tabular-nums">
          {item.quantity_in}
        </strong>
      </span>
      <Input
        className={cn(
          "h-11 w-28 text-center text-lg font-semibold",
          isOver && "border-destructive text-destructive",
        )}
        type="number"
        min="0"
        max={item.quantity_in}
        placeholder="Volvieron"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="w-32 shrink-0 text-right">
        {isOver ? (
          <span className="text-sm font-semibold text-destructive">
            No pueden volver más
          </span>
        ) : (
          <ShortageBadge shortage={shortage} totalIn={item.quantity_in} />
        )}
      </span>
    </div>
  );
}

function DispatchPanel({
  batchId,
  isCounted,
}: {
  batchId: number;
  isCounted: boolean;
}) {
  const dispatch = useDispatchBatch(batchId);
  const [receiver, setReceiver] = useState("");

  async function submit() {
    try {
      await dispatch.mutateAsync({ received_by_client: receiver, note: "" });
      toast.success("Lote despachado a faena.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div>
        <p className="text-sm font-semibold tracking-tight">
          Despachar a faena
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isCounted
            ? "La carga vuelve al campamento y el lote se cierra."
            : "Primero completa la cuenta de salida de todas las líneas: sin eso la merma quedaría sin registrar."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="h-11 max-w-64"
          placeholder="Recibe en faena (nombre)"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          disabled={!isCounted}
        />
        <Button
          className="h-11 px-6"
          disabled={!isCounted || dispatch.isPending}
          onClick={submit}
        >
          <Truck className="size-4" />
          Despachar
        </Button>
      </div>
    </Card>
  );
}
