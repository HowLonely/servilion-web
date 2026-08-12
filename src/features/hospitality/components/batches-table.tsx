"use client";

import Link from "next/link";
import { BedDouble, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import { CompanyLogo } from "@/features/companies/components/company-logo";
import { BatchStatusBadge } from "@/features/hospitality/components/batch-status-badge";
import { ShortageBadge } from "@/features/hospitality/components/shortage-badge";
import { useBatches } from "@/features/hospitality/hooks/use-hospitality";
import {
  BATCH_STATUSES,
  BATCH_STATUS_LABELS,
} from "@/features/hospitality/lib/status";
import { useState } from "react";

export function BatchesTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data: page, isLoading } = useBatches({
    search: search || undefined,
    status: status || undefined,
  });
  const batches = page?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-10 max-w-64"
          placeholder="Buscar por n° de lote o empresa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          <FilterChip
            label="Todos"
            active={status === ""}
            onClick={() => setStatus("")}
          />
          {BATCH_STATUSES.map((value) => (
            <FilterChip
              key={value}
              label={BATCH_STATUS_LABELS[value]}
              active={status === value}
              onClick={() => setStatus(value)}
            />
          ))}
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && batches.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <BedDouble className="size-10 text-muted-foreground" />
          <div>
            <p className="font-semibold">Todavía no hay lotes de lencería</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra la primera carga que llegue del campamento.
            </p>
          </div>
          <Button asChild>
            <Link href="/hospitality/new">
              <PackagePlus className="size-4" />
              Recibir carga
            </Link>
          </Button>
        </Card>
      )}

      {batches.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Recibido</TableHead>
                  <TableHead className="text-right">Piezas</TableHead>
                  <TableHead className="text-right">Devueltas</TableHead>
                  <TableHead>Merma</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/hospitality/${batch.id}`}
                        className="font-mono font-semibold hover:underline"
                      >
                        {batch.batch_number}
                      </Link>
                      {batch.camp_name && (
                        <p className="text-xs text-muted-foreground">
                          {batch.camp_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CompanyLogo
                          name={batch.company_name}
                          logoUrl={batch.company_logo_url}
                          className="size-8"
                        />
                        <span className="truncate">{batch.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(batch.received_at)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {batch.total_in.toLocaleString("es-CL")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {batch.total_out !== null
                        ? batch.total_out.toLocaleString("es-CL")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <ShortageBadge
                        shortage={batch.shortage}
                        totalIn={batch.total_in}
                      />
                    </TableCell>
                    <TableCell>
                      <BatchStatusBadge status={batch.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
