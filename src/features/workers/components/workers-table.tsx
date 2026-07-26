"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseApiError } from "@/lib/api/errors";
import { PaginationBar } from "@/components/layout/pagination-bar";
import { CompanySelect } from "@/features/companies/components/company-select";
import { WorkerFormDialog } from "@/features/workers/components/worker-form-dialog";
import {
  WORKERS_PAGE_SIZE,
  useDeactivateWorker,
  useWorkers,
} from "@/features/workers/hooks/use-workers";

export function WorkersTable() {
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);

  const { data: page, isLoading } = useWorkers({
    search: search || undefined,
    company_id: companyId,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: WORKERS_PAGE_SIZE,
    offset,
  });
  const workers = page?.items;
  const total = page?.count ?? 0;
  const deactivateWorker = useDeactivateWorker();

  async function handleDeactivate(workerId: number) {
    try {
      await deactivateWorker.mutateAsync(workerId);
      toast.success("Trabajador desactivado.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-64"
          />
          <div className="w-56">
            <CompanySelect
              value={companyId}
              onChange={(id) => {
                setCompanyId(id);
                setOffset(0);
              }}
              placeholder="Todas las empresas"
              includeAllOption="Todas las empresas"
            />
          </div>
          <Select
            value={activeFilter}
            onValueChange={(value: string) => {
              setActiveFilter(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <WorkerFormDialog trigger={<Button>Nuevo trabajador</Button>} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Campamento</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && workers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron trabajadores.
                </TableCell>
              </TableRow>
            )}
            {workers?.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.full_name}</TableCell>
                <TableCell>{worker.badge_code}</TableCell>
                <TableCell>
                  {worker.camp_name || "—"}
                  {worker.room_number ? ` · ${worker.room_number}` : ""}
                </TableCell>
                <TableCell>{worker.shift || "—"}</TableCell>
                <TableCell>{worker.position || "—"}</TableCell>
                <TableCell>
                  <Badge variant={worker.is_active ? "outline" : "secondary"}>
                    {worker.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <WorkerFormDialog
                        worker={worker}
                        trigger={
                          <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                            Editar
                          </DropdownMenuItem>
                        }
                      />
                      {worker.is_active && (
                        <DropdownMenuItem onClick={() => handleDeactivate(worker.id)}>
                          Desactivar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={WORKERS_PAGE_SIZE}
        total={total}
        itemLabel="trabajadores"
        onOffsetChange={setOffset}
      />
    </div>
  );
}
