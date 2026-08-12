import Link from "next/link";
import { PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BatchesTable } from "@/features/hospitality/components/batches-table";
import { HospitalityCounters } from "@/features/hospitality/components/hospitality-counters";

export default function HospitalityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lotes de lencería</h1>
          <p className="text-sm text-muted-foreground">
            Cargas de hotelería del campamento: sábanas, toallas y ropa de cama
            que llegan a granel y vuelven al mandante.
          </p>
        </div>
        <Button asChild>
          <Link href="/hospitality/new">
            <PackagePlus className="size-4" />
            Recibir carga
          </Link>
        </Button>
      </div>

      <HospitalityCounters />
      <BatchesTable />
    </div>
  );
}
