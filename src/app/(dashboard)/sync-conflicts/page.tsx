import { PageHeader } from "@/components/layout/page-header";
import { SyncConflictsTable } from "@/features/orders/components/sync-conflicts-table";

export default function SyncConflictsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conflictos de sincronización"
        description="Cambios que la app móvil intentó sincronizar y el servidor descartó por ser más antiguos que la versión ya guardada."
      />
      <SyncConflictsTable />
    </div>
  );
}
