import { PageHeader } from "@/components/layout/page-header";
import { LinenCountForm } from "@/features/hospitality/components/linen-count-form";

export default async function LinenCountPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; location?: string }>;
}) {
  const { company, location } = await searchParams;
  const companyId = Number(company);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conteo de inventario"
        description="Registra cuánta lencería hay contada en un campamento o en la bodega de faena. Sirve de carga inicial y de reajuste."
      />
      <LinenCountForm
        initialCompanyId={Number.isInteger(companyId) && companyId > 0 ? companyId : undefined}
        initialLocation={location}
      />
    </div>
  );
}
