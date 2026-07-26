import { PageHeader } from "@/components/layout/page-header";
import { CampsPageClient } from "@/features/camps/components/camps-page-client";

export default function CampamentosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campamentos y rooms"
        description="Alojamiento de la faena. Cada habitación lleva un código QR que se pega en la puerta y se escanea al entregar la ropa limpia."
      />
      <CampsPageClient />
    </div>
  );
}
