import { PageHeader } from "@/components/layout/page-header";
import { LinenMovementsTable } from "@/features/hospitality/components/linen-movements-table";

export default function LinenMovementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimientos de lencería"
        description="Despachos de la planta, repartos y retiros en faena y conteos de inventario. Los saldos se calculan desde aquí."
      />
      <LinenMovementsTable />
    </div>
  );
}
