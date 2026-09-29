import Link from "next/link";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { LinenBalances } from "@/features/hospitality/components/linen-balances";

export default function HospitalityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saldos de hotelería"
        description="Dónde está la hotelería de cada cliente de hotelería: en sus campamentos, en la bodega de faena o en poder de Servilion."
        actions={
          <Button variant="outline" asChild>
            <Link href="/hospitality/movements">
              <History className="size-4" />
              Ver movimientos
            </Link>
          </Button>
        }
      />
      <LinenBalances />
    </div>
  );
}
