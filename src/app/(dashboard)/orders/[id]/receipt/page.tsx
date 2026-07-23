import { OrderReceipt } from "@/features/orders/components/order-receipt";

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold">Boleta de la OT</h1>
        <p className="text-sm text-muted-foreground">
          Comprobante que acompaña la ropa limpia de vuelta a faena.
        </p>
      </div>
      <OrderReceipt orderId={Number(id)} />
    </div>
  );
}
