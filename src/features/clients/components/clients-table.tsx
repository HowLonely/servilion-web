"use client";

import { useState } from "react";
import { MoreHorizontal, Tag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog";
import { ClientPriceCatalog } from "@/features/clients/components/client-price-catalog";
import {
  CLIENTS_PAGE_SIZE,
  useClients,
  useDeactivateClient,
} from "@/features/clients/hooks/use-clients";

import type { components } from "@/lib/api/schema";

type ClientOut = components["schemas"]["ClientOut"];

export function ClientsTable() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [offset, setOffset] = useState(0);

  const { data: page, isLoading } = useClients({
    search: search || undefined,
    is_active: activeFilter === "all" ? undefined : activeFilter === "true",
    limit: CLIENTS_PAGE_SIZE,
    offset,
  });
  const clients = page?.items;
  const total = page?.count ?? 0;
  const deactivateClient = useDeactivateClient();

  async function handleDeactivate(clientId: number) {
    try {
      await deactivateClient.mutateAsync(clientId);
      toast.success("Cliente desactivado.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre..."
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
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ClientFormDialog trigger={<Button>Nuevo cliente</Button>} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24" />
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
            {!isLoading && clients?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            )}
            {clients?.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onDeactivate={handleDeactivate}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={CLIENTS_PAGE_SIZE}
        total={total}
        itemLabel="clientes"
        onOffsetChange={setOffset}
      />
    </div>
  );
}

function ClientRow({
  client,
  onDeactivate,
}: {
  client: ClientOut;
  onDeactivate: (clientId: number) => void;
}) {
  const [pricesOpen, setPricesOpen] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium">{client.name}</TableCell>
      <TableCell>
        {/* is_single_company marca el caso "el cliente es la misma empresa". */}
        <Badge variant={client.is_single_company ? "secondary" : "outline"}>
          {client.is_single_company ? "Cliente = empresa" : "Grupo de empresas"}
        </Badge>
      </TableCell>
      <TableCell>{client.company_count}</TableCell>
      <TableCell>{client.tax_id || "—"}</TableCell>
      <TableCell>{client.contact_name || "—"}</TableCell>
      <TableCell>
        <Badge variant={client.is_active ? "outline" : "secondary"}>
          {client.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell className="flex items-center gap-1">
        <Dialog open={pricesOpen} onOpenChange={setPricesOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Tag className="size-4" />
              Precios
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Catálogo de precios · {client.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <ClientPriceCatalog clientId={client.id} />
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ClientFormDialog
              client={client}
              trigger={
                <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                  Editar
                </DropdownMenuItem>
              }
            />
            {client.is_active && (
              <DropdownMenuItem onClick={() => onDeactivate(client.id)}>
                Desactivar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
