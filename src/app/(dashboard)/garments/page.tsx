import { LayoutGrid, Scale } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GarmentsTable } from "@/features/garments/components/garments-table";
import { PriceMatrix } from "@/features/garments/components/price-matrix";

export default function GarmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prendas"
        description="Catálogo de prendas y comparativa de tarifas por cliente."
      />

      <Tabs defaultValue="catalog" className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="catalog">
            <LayoutGrid />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="prices">
            <Scale />
            Comparativa de precios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <GarmentsTable />
        </TabsContent>
        <TabsContent value="prices">
          <PriceMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
