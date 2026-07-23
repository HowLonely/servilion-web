import { PageHeader } from "@/components/layout/page-header";
import { PackingStation } from "@/features/orders/components/packing-station";

export default function PackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empaque y revisión"
        description="Valida el morral limpio pistoleando cada prenda antes de despacharlo."
      />
      <PackingStation />
    </div>
  );
}
