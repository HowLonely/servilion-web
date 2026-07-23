import { PageHeader } from "@/components/layout/page-header";
import { WorkersTable } from "@/features/workers/components/workers-table";

export default function WorkersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trabajadores"
        description="Personal en faena asociado a las OT de lavado."
      />
      <WorkersTable />
    </div>
  );
}
