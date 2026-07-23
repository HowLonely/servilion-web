"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientSelect } from "@/features/clients/components/client-select";
import { CompanySelect } from "@/features/companies/components/company-select";
import { WorkerSelect } from "@/features/workers/components/worker-select";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "@/features/orders/lib/status";

export type OrdersFilterState = {
  search?: string;
  status?: string;
  clientId?: number;
  companyId?: number;
  workerId?: number;
  dateFrom: string;
  dateTo: string;
};

export function OrdersFilterBar({
  value,
  onChange,
}: {
  value: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      {/* Las tres capas de trazabilidad se buscan con un mismo campo: n° de OT,
          ref de las etiquetas lavables y código de control de la boleta. */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Buscar</label>
        <Input
          placeholder="OT, ref, control, RUT o nombre..."
          value={value.search ?? ""}
          onChange={(e) =>
            onChange({ ...value, search: e.target.value || undefined })
          }
          className="w-64"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Desde</label>
        <Input
          type="date"
          value={value.dateFrom}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Hasta</label>
        <Input
          type="date"
          value={value.dateTo}
          onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Estado</label>
        <Select
          value={value.status ?? "__all__"}
          onValueChange={(status: string) =>
            onChange({ ...value, status: status === "__all__" ? undefined : status })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Cliente</label>
        <div className="w-52">
          <ClientSelect
            value={value.clientId}
            onChange={(clientId) => onChange({ ...value, clientId })}
            placeholder="Todos los clientes"
            includeAllOption="Todos los clientes"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Empresa</label>
        <div className="w-52">
          <CompanySelect
            value={value.companyId}
            onChange={(companyId) => onChange({ ...value, companyId })}
            placeholder="Todas las empresas"
            includeAllOption="Todas las empresas"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Trabajador</label>
        <div className="flex w-64 items-center gap-1">
          <WorkerSelect
            value={value.workerId}
            onChange={(workerId) => onChange({ ...value, workerId })}
          />
          {value.workerId !== undefined && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange({ ...value, workerId: undefined })}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
