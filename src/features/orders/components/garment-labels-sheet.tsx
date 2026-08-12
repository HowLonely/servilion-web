"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GarmentLabel } from "@/features/orders/components/garment-label";
import { useGarmentLabels } from "@/features/orders/hooks/use-orders";

/**
 * Pliego de etiquetas lavables de una OT: una por línea declarada, aunque
 * declare varias unidades.
 *
 * Se imprime al digitalizar la OT y se pega en una de las prendas de esa
 * línea antes de mandar el morral a lavar. Las unidades de una misma prenda
 * comparten el mismo código: al empacar no interesa cuál volvió, sino cuántas
 * de las declaradas ya están en el morral, así que un solo adhesivo se
 * pistolea tantas veces como unidades vuelvan.
 */
export function GarmentLabelsSheet({ orderId }: { orderId: number }) {
  const { data: labels, isLoading, error } = useGarmentLabels(orderId);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !labels) {
    return <p className="text-destructive">No se pudieron cargar las etiquetas.</p>;
  }

  if (labels.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Esta OT no tiene prendas declaradas, así que no hay etiquetas que
          imprimir.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir pliego
        </Button>
        <p className="text-sm text-muted-foreground">
          {labels.length} etiqueta{labels.length === 1 ? "" : "s"} · una por
          tipo de prenda declarada. Pégala en una unidad y pistoléala tantas
          veces como unidades vuelvan.
        </p>
      </div>

      <div className="print-area grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {labels.map((label) => (
          <GarmentLabel
            key={label.scan_payload}
            reference={label.reference}
            labelCode={label.label_code}
            scanPayload={label.scan_payload}
            garmentName={label.garment_name}
            workerName={label.worker_name}
            companyName={label.company_name}
            camp={label.camp}
            quantity={label.quantity}
          />
        ))}
      </div>
    </div>
  );
}
