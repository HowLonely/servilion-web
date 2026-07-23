import { PageHeader } from "@/components/layout/page-header";
import { OperationsDashboard } from "@/features/reports/components/operations-dashboard";

export default function OperationsReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Torre de control"
        description="Estado operativo en tiempo real: trabajo en proceso, cuellos de botella y OT atascadas."
      />
      <OperationsDashboard />
    </div>
  );
}
