"use client";

import { useState } from "react";
import { ImageIcon, MoreHorizontal } from "lucide-react";
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
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import { CompanyLogoDialog } from "@/features/companies/components/company-logo-dialog";
import {
  COMPANIES_PAGE_SIZE,
  useCompanies,
  useDeactivateCompany,
} from "@/features/companies/hooks/use-companies";

export function CompaniesTable() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);

  const { data: page, isLoading } = useCompanies({
    search: search || undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: COMPANIES_PAGE_SIZE,
    offset,
  });
  const companies = page?.items;
  const total = page?.count ?? 0;
  const deactivateCompany = useDeactivateCompany();

  async function handleDeactivate(companyId: number) {
    try {
      await deactivateCompany.mutateAsync(companyId);
      toast.success("Empresa desactivada.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre o RUT..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-64"
          />
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
              <SelectItem value="true">Activas</SelectItem>
              <SelectItem value="false">Inactivas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CompanyFormDialog trigger={<Button>Nueva empresa</Button>} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Cobro</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && companies?.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No se encontraron empresas.
                </TableCell>
              </TableRow>
            )}
            {companies?.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <CompanyLogoDialog
                    companyId={company.id}
                    logoUrl={company.logo_url}
                    trigger={
                      company.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="h-8 w-8 cursor-pointer rounded object-contain"
                        />
                      ) : (
                        <Button variant="ghost" size="icon">
                          <ImageIcon className="size-4" />
                        </Button>
                      )
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>
                  {company.client_name === company.name
                    ? "— (propia)"
                    : company.client_name}
                </TableCell>
                <TableCell>{company.tax_id || "—"}</TableCell>
                <TableCell>
                  {company.billing_type === "PRENDAS" ? "Prendas" : "Kilos"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {company.delivery_flow === "FLUJO_2"
                      ? "Flujo 2 · solo cliente"
                      : "Flujo 1 · habitación"}
                  </Badge>
                </TableCell>
                <TableCell>{company.contact_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={company.is_active ? "outline" : "secondary"}>
                    {company.is_active ? "Activa" : "Inactiva"}
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
                      <CompanyFormDialog
                        company={company}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e: Event) => e.preventDefault()}
                          >
                            Editar
                          </DropdownMenuItem>
                        }
                      />
                      {company.is_active && (
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(company.id)}
                        >
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
        pageSize={COMPANIES_PAGE_SIZE}
        total={total}
        itemLabel="empresas"
        onOffsetChange={setOffset}
      />
    </div>
  );
}
