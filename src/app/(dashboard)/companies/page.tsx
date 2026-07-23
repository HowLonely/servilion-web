import { PageHeader } from "@/components/layout/page-header";
import { CompaniesTable } from "@/features/companies/components/companies-table";

export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Empresas"
        description="Empresas mandantes que envían prendas a lavado."
      />
      <CompaniesTable />
    </div>
  );
}
