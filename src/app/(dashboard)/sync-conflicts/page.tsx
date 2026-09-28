import { PageHeader } from "@/components/layout/page-header";
import { SyncConflictsTable } from "@/features/orders/components/sync-conflicts-table";
import { LocalServerStatus, SyncIssuesTable } from "@/features/sync/components/local-server-status";

export default function SyncConflictsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Sincronización"
        description="La planta opera contra su servidor local, que envía todo a esta nube. Aquí se ve si está conectado y qué se resolvió solo."
      />
      <LocalServerStatus />
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Incidencias con el servidor local</h2>
          <p className="text-sm text-muted-foreground">
            Fichas editadas en los dos lados a la vez, nombres duplicados creados sin conexión y filas que no se
            pudieron aplicar.
          </p>
        </div>
        <SyncIssuesTable />
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Conflictos de la app móvil</h2>
          <p className="text-sm text-muted-foreground">
            Cambios que la app intentó sincronizar y el servidor descartó por ser más antiguos que la versión guardada.
          </p>
        </div>
        <SyncConflictsTable />
      </section>
    </div>
  );
}
