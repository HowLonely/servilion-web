import { PageHeader } from "@/components/layout/page-header";
import { BillingReportForm } from "@/features/reports/components/billing-report-form";

export default function BillingReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Facturación"
        description="Genera el reporte de cobro por cliente (con desglose por empresa) o por una empresa, en un período."
      />
      <BillingReportForm />
    </div>
  );
}
