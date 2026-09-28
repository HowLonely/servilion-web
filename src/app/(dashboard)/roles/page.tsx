import { PageHeader } from "@/components/layout/page-header";
import { RolesList } from "@/features/users/components/roles-list";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles y permisos"
        description="Cada rol es un conjunto de permisos. Cambiarlo afecta a todos sus usuarios."
      />
      <RolesList />
    </div>
  );
}
