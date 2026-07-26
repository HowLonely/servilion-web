import { DashboardHomeGuard } from "@/components/layout/dashboard-home-guard";
import { PageHeader } from "@/components/layout/page-header";
import { OrderShortcuts } from "@/features/orders/components/order-shortcuts";
import { OrderStatusSummary } from "@/features/orders/components/order-status-summary";

export default function DashboardPage() {
  return (
    <DashboardHomeGuard>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Panel"
          description="Estado general de las OT y accesos rápidos al flujo operativo."
        />
        <OrderStatusSummary />
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Accesos del flujo
            </h2>
            <p className="text-sm text-muted-foreground">
              Puntos donde el sistema interviene en el proceso de lavado.
            </p>
          </div>
          <OrderShortcuts />
        </section>
      </div>
    </DashboardHomeGuard>
  );
}
