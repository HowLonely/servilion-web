import { PageHeader } from "@/components/layout/page-header";
import { ExpressQuotaSettings } from "@/features/weighing/components/express-quota-settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración"
        description="Parámetros operativos que usan las terminales de la planta."
      />
      <ExpressQuotaSettings />
    </div>
  );
}
