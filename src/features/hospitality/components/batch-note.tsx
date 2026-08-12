"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date";
import { useBatchNote } from "@/features/hospitality/hooks/use-hospitality";

/**
 * Acta de devolución del lote: el equivalente a la boleta, pero para hotelería.
 *
 * No lleva trabajador, RUT, habitación ni QR de entrega —nada de eso existe en
 * un lote— y en cambio lleva el conteo por tipo de lencería con su merma. Es el
 * documento que el encargado del campamento revisa contra la carga y firma, así
 * que la columna de diferencias es lo que tiene que quedar indiscutible.
 *
 * Colores fijos en blanco y negro: se imprime en papel, con la impresora que
 * haya, sin importar si la app está en modo oscuro.
 */
export function BatchNote({ batchId }: { batchId: number }) {
  const { data: note, isLoading, error } = useBatchNote(batchId);

  if (isLoading) return <Skeleton className="h-96 w-full max-w-3xl" />;
  if (error || !note) {
    return <p className="text-destructive">No se pudo cargar el acta.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="w-fit print:hidden"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Imprimir acta
      </Button>

      {/* `print-area`: en impresión globals.css oculta todo el body y deja
          visible solo esta marca (si no, saldría también el menú lateral). */}
      <div className="print-area w-full max-w-3xl">
        <div className="flex flex-col border border-black bg-white text-black">
          <div className="flex items-center justify-between gap-4 border-b border-black px-6 py-3">
            <div>
              <p className="text-lg leading-none font-black tracking-[0.2em] uppercase">
                Servilion
              </p>
              <p className="mt-1 text-[10px] text-neutral-600">
                Lavandería industrial · 055-2547343
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500">
                  Acta de devolución
                </p>
                <p className="font-mono text-xl leading-tight font-bold">
                  {note.batch_number}
                </p>
              </div>
              {note.company_logo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- logo remoto (S3) de tamaño variable, sin necesidad de optimización de Next/Image en un documento impreso.
                <img
                  src={note.company_logo_url}
                  alt=""
                  className="max-h-12 max-w-32 object-contain"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-black px-6 py-3 text-sm">
            <Field label="Contrato" value={note.company_name} />
            {note.camp && <Field label="Campamento" value={note.camp} />}
            <Field label="Recepción" value={formatDate(note.received_at)} />
            <Field
              label="Devolución"
              value={
                note.dispatched_at ? formatDate(note.dispatched_at) : "Pendiente"
              }
            />
            {note.weight_kg !== null && (
              <Field
                label="Peso"
                value={`${note.weight_kg.toLocaleString("es-CL")} kg`}
              />
            )}
          </div>

          {/* El conteo es el cuerpo del acta: es lo que se revisa contra la carga */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black bg-neutral-100 text-left">
                <th className="px-6 py-2 font-semibold">Lencería</th>
                <th className="px-3 py-2 text-right font-semibold">Recibidas</th>
                <th className="px-3 py-2 text-right font-semibold">Devueltas</th>
                <th className="px-6 py-2 text-right font-semibold">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {note.items.map((item) => (
                <tr key={item.item_id} className="border-b border-neutral-300">
                  <td className="px-6 py-1.5">{item.name}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {item.quantity_in}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {item.quantity_out ?? "—"}
                  </td>
                  <td className="px-6 py-1.5 text-right font-semibold tabular-nums">
                    {item.shortage === null
                      ? "—"
                      : item.shortage === 0
                        ? "0"
                        : `−${item.shortage}`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold">
                <td className="px-6 py-2">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {note.total_in}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {note.total_out ?? "—"}
                </td>
                <td className="px-6 py-2 text-right tabular-nums">
                  {note.shortage === null
                    ? "—"
                    : note.shortage === 0
                      ? "0"
                      : `−${note.shortage}`}
                </td>
              </tr>
            </tfoot>
          </table>

          {note.observations && (
            <div className="border-t border-neutral-300 px-6 py-2 text-xs">
              <span className="font-semibold uppercase">Observaciones: </span>
              <span className="whitespace-pre-line">{note.observations}</span>
            </div>
          )}

          {/* La firma reemplaza al pistoleo: en hotelería no hay QR de
              habitación ni trabajador que reciba, recibe el encargado. */}
          <div className="flex items-end justify-between gap-8 px-6 pt-10 pb-4">
            <div className="flex-1">
              <div className="border-t border-black pt-1 text-center text-[10px] uppercase">
                Entrega · Servilion
              </div>
            </div>
            <div className="flex-1">
              <div className="border-t border-black pt-1 text-center text-[10px] uppercase">
                Recibe conforme · {note.received_by_client || "Faena"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
        {label}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
