import { PageHeader } from "@/components/layout/page-header";
import { DispatchStation } from "@/features/orders/components/dispatch-station";

export default function DispatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Despacho"
        description="Pistolea la boleta de un morral cerrado para sacarlo de planta."
      />
      <DispatchStation />
    </div>
  );
}
