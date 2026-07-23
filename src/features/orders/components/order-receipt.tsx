"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date";
import { useOrderReceipt } from "@/features/orders/hooks/use-orders";

// Boleta que se imprime al terminar el empaque y acompaña la ropa limpia de
// vuelta a faena (FLUJO_NEGOCIO.md §3.2). Los campos y su orden replican el
// comprobante real; el código de barras grande lleva el RUT sin puntos ni
// guion, que es lo que se pistoléa al entregar.
export function OrderReceipt({ orderId }: { orderId: number }) {
  const { data: receipt, isLoading, error } = useOrderReceipt(orderId);

  if (isLoading) return <Skeleton className="h-96 w-full max-w-md" />;
  if (error || !receipt) {
    return <p className="text-destructive">No se pudo cargar la boleta.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="w-fit print:hidden"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Imprimir boleta
      </Button>

      <div className="w-full max-w-md rounded-md border bg-background p-6 font-mono text-sm">
        <p className="text-center text-base font-semibold">SERVILION</p>
        <p className="mb-4 text-center text-xs">Lavandería industrial</p>

        <Row label="N° O/T" value={receipt.order_number || "S/N"} strong />
        <Row label="Referencia" value={receipt.reference || "—"} strong />
        <Row label="Empresa" value={receipt.company_name} />
        <Row label="Trabajador" value={receipt.worker_name} />
        <Row label="RUT" value={receipt.national_id || "—"} />
        <Row label="Módulo / patio" value={receipt.camp || "—"} />
        <Row label="Habitación" value={receipt.room || "—"} />
        <Row label="Turno" value={receipt.shift || "—"} />
        <Row
          label="Peso"
          value={receipt.weight_kg !== null ? `${receipt.weight_kg} Kgs` : "—"}
        />
        <Row label="Prendas" value={String(receipt.garment_count)} />
        <Row label="Entrega tentativa" value={formatDate(receipt.promised_at)} />
        <Row label="Código control" value={receipt.control_code || "—"} />

        <div className="my-4 border-t pt-3">
          <p className="mb-2 text-xs uppercase">Detalle</p>
          {receipt.items.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span>{item.name}</span>
              <span>{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 text-center">
          <p className="text-xs uppercase text-muted-foreground">
            Código de entrega
          </p>
          <p className="text-lg tracking-[0.35em]">{receipt.qr_payload || "—"}</p>
          <p className="text-[10px] text-muted-foreground">
            Se escanea junto al QR de la habitación al entregar el morral.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : undefined}>{value}</span>
    </div>
  );
}
