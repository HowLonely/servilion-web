"use client";

import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import { useOrderReceipt } from "@/features/orders/hooks/use-orders";

/**
 * Boleta que acompaña la ropa limpia de vuelta a faena (FLUJO_NEGOCIO.md §3.2).
 *
 * El diseño no replica la tabla de recuadros del comprobante antiguo: se
 * reordenó según lo que realmente se lee de ella. Quien la usa en faena tiene
 * el morral en la mano y necesita responder dos cosas —a quién es y dónde va—,
 * así que el nombre y el destino ocupan la mitad de la boleta, y los códigos
 * administrativos (OT, ref, control) bajan a una fila de apoyo. El bloque de
 * escaneo queda aislado a la derecha para poder pistolearlo sin tapar el resto.
 *
 * Colores fijos en blanco y negro (no tokens de tema) porque esto se imprime en
 * papel, con la impresora que haya, sin importar si la app está en modo oscuro.
 * El logo del cliente es la única mancha de color y por eso funciona como la
 * marca de identificación rápida del morral en la mesa de despacho.
 */
export function OrderReceipt({ orderId }: { orderId: number }) {
  const { data: receipt, isLoading, error } = useOrderReceipt(orderId);

  if (isLoading) return <Skeleton className="h-72 w-full max-w-4xl" />;
  if (error || !receipt) {
    return <p className="text-destructive">No se pudo cargar la boleta.</p>;
  }

  const destino = [receipt.camp, receipt.room].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* La boleta es apaisada, así que en papel va horizontal. Vive en este
          componente y no en globals.css para no forzar el horizontal también al
          pliego de etiquetas, que es vertical. */}
      <style>{"@media print { @page { size: landscape; margin: 10mm; } }"}</style>

      <Button
        variant="outline"
        className="w-fit print:hidden"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Imprimir boleta
      </Button>

      {/* `print-area`: en impresión globals.css oculta todo el body y solo deja
          visible esta marca (si no, saldría también el menú lateral). */}
      <div className="print-area w-full max-w-4xl overflow-x-auto">
        <div className="flex min-w-2xl flex-col border border-black bg-white text-black">
          {/* Cabecera: emisor a la izquierda, cliente a la derecha */}
          <div className="flex items-center justify-between gap-4 border-b border-black px-5 py-2.5">
            <div className="min-w-0">
              <p className="text-lg leading-none font-black tracking-[0.2em] uppercase">
                Servilion
              </p>
              <p className="mt-1 text-[10px] leading-none text-neutral-600">
                Lavandería industrial · 055-2547343 ·
                servilion.ltda@hotmail.com
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {/* Faena arriba y empresa abajo: quien recibe en faena mira esta
                  esquina para saber de quién es el morral. "Contratista" va
                  recuadrado porque es lo que distingue esa ropa de la del
                  mandante, que se lava y factura bajo el mismo cliente. */}
              <div className="min-w-0 text-right">
                {receipt.faena && (
                  <p className="truncate text-[9px] leading-none font-semibold tracking-[0.15em] uppercase text-neutral-500">
                    {receipt.faena}
                  </p>
                )}
                <p className="mt-1 max-w-40 truncate text-xs font-bold uppercase">
                  {receipt.company_name}
                </p>
                {receipt.is_contractor && (
                  <p className="mt-1 inline-block border border-black px-1 py-0.5 text-[8px] leading-none font-black tracking-[0.15em] uppercase">
                    Contratista
                  </p>
                )}
              </div>
              {receipt.company_logo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- logo remoto (S3) de tamaño variable, sin necesidad de optimización de Next/Image en un comprobante impreso.
                <img
                  src={receipt.company_logo_url}
                  alt=""
                  className="max-h-11 max-w-32 object-contain"
                />
              )}
            </div>
          </div>

          <div className="flex">
            {/* Lo que se lee primero: a quién es y dónde va */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500">
                  Trabajador
                </p>
                <p className="truncate text-3xl leading-tight font-bold uppercase">
                  {receipt.worker_name}
                </p>
                <p className="mt-0.5 text-sm tabular-nums text-neutral-700">
                  {receipt.national_id || "Sin RUT"}
                  {receipt.shift && ` · Turno ${receipt.shift}`}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500">
                  Entregar en
                </p>
                <p className="truncate text-2xl leading-tight font-bold uppercase">
                  {destino.length > 0 ? destino.join(" · ") : "Sin destino"}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  {receipt.camp ? "Módulo / patio · habitación / pieza" : ""}
                </p>
              </div>
            </div>

            {/* Bloque de escaneo, aislado para pistolearlo sin tapar el resto */}
            <div className="flex w-52 shrink-0 flex-col items-center justify-center gap-1.5 border-l border-black px-3 py-4">
              <QRCodeSVG
                value={receipt.qr_payload}
                size={112}
                level="H"
                marginSize={0}
              />
              <p className="text-[9px] font-semibold tracking-[0.15em] uppercase text-neutral-500">
                Código de entrega
              </p>
              <p className="text-2xl leading-none font-black tabular-nums">
                {receipt.qr_payload || "—"}
              </p>
            </div>
          </div>

          {/* Fila de apoyo: los códigos administrativos y el resumen del morral */}
          <div className="flex divide-x divide-neutral-300 border-t border-black bg-neutral-50">
            <Meta label="N° O/T" value={receipt.order_number || "S/N"} strong />
            <Meta label="Ref" value={receipt.reference || "—"} mono />
            <Meta label="Control" value={receipt.control_code || "—"} mono />
            <Meta label="Prendas" value={String(receipt.garment_count)} strong />
            <Meta
              label="Peso"
              value={receipt.weight_kg !== null ? `${receipt.weight_kg} kg` : "—"}
            />
            <Meta label="Teléfono" value={receipt.phone || "—"} />
            <Meta
              label="Entrega tentativa"
              value={formatDate(receipt.promised_at)}
              strong
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dato de apoyo de la fila inferior: rótulo chico arriba, valor abajo. */
function Meta({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1 px-3 py-2">
      <p className="truncate text-[9px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
        {label}
      </p>
      <p
        className={cn(
          "truncate leading-tight",
          mono && "font-mono",
          strong ? "text-base font-bold" : "text-sm font-semibold",
        )}
      >
        {value}
      </p>
    </div>
  );
}
