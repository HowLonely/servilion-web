"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { dateInputDaysAgo, dayRangeToIsoUtc } from "@/lib/date";
import {
  OrdersFilterBar,
  type OrdersFilterState,
} from "@/features/orders/components/orders-filter-bar";
import { OrdersTable } from "@/features/orders/components/orders-table";

export function OrdersPageClient() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<OrdersFilterState>({
    status: searchParams.get("status") ?? undefined,
    dateFrom: searchParams.get("date_from") ?? dateInputDaysAgo(30),
    dateTo: searchParams.get("date_to") ?? dateInputDaysAgo(0),
  });

  const { date_from, date_to } = dayRangeToIsoUtc(filters.dateFrom, filters.dateTo);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Órdenes de trabajo"
        description="Órdenes de lavado registradas. Filtra por estado, cliente, empresa o fecha."
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <Plus />
              Nueva OT
            </Link>
          </Button>
        }
      />

      <OrdersFilterBar value={filters} onChange={setFilters} />
      {/* La `key` remonta la tabla al cambiar los filtros para que la
          paginación vuelva a la primera página. */}
      <OrdersTable
        key={JSON.stringify(filters)}
        filters={{
          search: filters.search,
          status: filters.status,
          client_id: filters.clientId,
          company_id: filters.companyId,
          worker_id: filters.workerId,
          date_from,
          date_to,
        }}
      />
    </div>
  );
}
