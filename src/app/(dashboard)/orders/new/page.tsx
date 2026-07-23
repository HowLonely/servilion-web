import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { CreateOrderForm } from "@/features/orders/components/create-order-form";

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Digitalizar OT"
        description="Digitaliza la OT física al recibir la ropa sucia en Antofagasta."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeft />
              Volver a OT
            </Link>
          </Button>
        }
      />
      <div className="max-w-5xl">
        <CreateOrderForm />
      </div>
    </div>
  );
}
