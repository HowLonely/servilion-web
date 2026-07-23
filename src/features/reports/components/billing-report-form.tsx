"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { dayRangeToIsoUtc } from "@/lib/date";
import { parseApiError } from "@/lib/api/errors";
import { ClientSelect } from "@/features/clients/components/client-select";
import { CompanySelect } from "@/features/companies/components/company-select";
import { BillingReportResult } from "@/features/reports/components/billing-report-result";
import {
  useBillingReportTask,
  useRequestBillingReport,
} from "@/features/reports/hooks/use-billing-report";

type Scope = "client" | "company";

export function BillingReportForm() {
  const [scope, setScope] = useState<Scope>("client");
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [taskId, setTaskId] = useState<string | undefined>(undefined);

  const requestReport = useRequestBillingReport();
  const { data: task } = useBillingReportTask(taskId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const targetId = scope === "client" ? clientId : companyId;
    if (!targetId || !dateFrom || !dateTo) {
      toast.error(
        `Selecciona ${scope === "client" ? "cliente" : "empresa"} y rango de fechas.`,
      );
      return;
    }
    try {
      const { date_from, date_to } = dayRangeToIsoUtc(dateFrom, dateTo);
      const { task_id } = await requestReport.mutateAsync({
        client_id: scope === "client" ? clientId : undefined,
        company_id: scope === "company" ? companyId : undefined,
        date_from,
        date_to,
      });
      setTaskId(task_id);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="max-w-xl">
        <FieldGroup>
          <Field>
            <FieldLabel>Agrupar por</FieldLabel>
            <FieldContent>
              <Select
                value={scope}
                onValueChange={(value: string) => setScope(value as Scope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">
                    Cliente (todas sus empresas)
                  </SelectItem>
                  <SelectItem value="company">Una empresa</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{scope === "client" ? "Cliente" : "Empresa"}</FieldLabel>
            <FieldContent>
              {scope === "client" ? (
                <ClientSelect value={clientId} onChange={setClientId} />
              ) : (
                <CompanySelect value={companyId} onChange={setCompanyId} />
              )}
            </FieldContent>
          </Field>
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="date_from">Desde</FieldLabel>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </FieldContent>
            <FieldContent>
              <FieldLabel htmlFor="date_to">Hasta</FieldLabel>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" className="mt-4" disabled={requestReport.isPending}>
          {requestReport.isPending ? "Generando..." : "Generar reporte"}
        </Button>
      </form>

      {taskId && (
        <Card>
          <CardContent className="pt-6">
            {!task || task.status === "PENDING" || task.status === "STARTED" ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Generando reporte...
                </p>
                <Skeleton className="h-24 w-full" />
              </div>
            ) : task.status === "FAILURE" ? (
              <p className="text-destructive">
                No se pudo generar el reporte. Intenta nuevamente.
              </p>
            ) : (
              <BillingReportResult result={task.result ?? {}} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
