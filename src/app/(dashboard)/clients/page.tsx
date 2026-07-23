import { PageHeader } from "@/components/layout/page-header";
import { ClientsTable } from "@/features/clients/components/clients-table";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Cada cliente agrupa una o varias empresas y define su catálogo de precios. Cuando el cliente es una sola empresa, se maneja igual con una empresa hija."
      />
      <ClientsTable />
    </div>
  );
}
