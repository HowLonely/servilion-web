import { GarmentLabelsSheet } from "@/features/orders/components/garment-labels-sheet";

export default async function OrderGarmentLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold">Etiquetas lavables de la OT</h1>
        <p className="text-sm text-muted-foreground">
          Una etiqueta por tipo de prenda declarado. Su QR lleva el ref del
          morral y el código de la prenda, así que al empacar un solo disparo
          abre el morral y marca la prenda.
        </p>
      </div>
      <GarmentLabelsSheet orderId={Number(id)} />
    </div>
  );
}
