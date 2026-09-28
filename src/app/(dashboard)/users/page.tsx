import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/features/users/components/users-table";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas del staff para la web, la terminal de planta y la app móvil. Lo que cada una puede hacer lo define su rol."
      />
      <UsersTable />
    </div>
  );
}
