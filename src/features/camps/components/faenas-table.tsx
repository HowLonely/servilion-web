"use client";

import { useState } from "react";
import { Pickaxe, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { parseApiError } from "@/lib/api/errors";
import {
  useCreateFaena,
  useFaenas,
  useUpdateFaena,
} from "@/features/camps/hooks/use-camps";

import type { components } from "@/lib/api/schema";

type FaenaOut = components["schemas"]["FaenaOut"];

/**
 * Faenas: los sitios físicos donde Servilion presta servicio.
 *
 * Se administran aparte de los campamentos porque son de otra naturaleza: una
 * faena se crea una vez, al empezar a atender un sitio nuevo, mientras que los
 * campamentos y las piezas se cargan y se dan de baja seguido.
 */
export function FaenasTable() {
  const { data: page, isLoading } = useFaenas();
  const faenas = page?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          La faena es el sitio físico dueño de los campamentos y de los QR de
          las puertas. Una misma pieza aloja a trabajadores de distintas
          contratistas, se le facture a quien se le facture.
        </p>
        <FaenaFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Nueva faena
            </Button>
          }
        />
      </div>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {!isLoading && faenas.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Pickaxe className="size-10 text-muted-foreground" />
          <div>
            <p className="font-semibold">Todavía no hay faenas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la faena antes de cargar sus campamentos.
            </p>
          </div>
        </Card>
      )}

      {faenas.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faena</TableHead>
                  <TableHead className="text-right">Campamentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faenas.map((faena) => (
                  <TableRow key={faena.id}>
                    <TableCell className="font-semibold">{faena.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {faena.camps_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {faena.is_active ? "Activa" : "Inactiva"}
                    </TableCell>
                    <TableCell className="text-right">
                      <FaenaFormDialog
                        faena={faena}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
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

function FaenaFormDialog({
  faena,
  trigger,
}: {
  faena?: FaenaOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(faena?.name ?? "");
  const isEdit = Boolean(faena);

  const createFaena = useCreateFaena();
  const updateFaena = useUpdateFaena(faena?.id ?? -1);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Escribe el nombre de la faena.");
      return;
    }
    const body = { name: name.trim(), is_active: faena?.is_active ?? true };
    try {
      if (isEdit) await updateFaena.mutateAsync(body);
      else await createFaena.mutateAsync(body);
      toast.success(isEdit ? "Faena actualizada." : "Faena creada.");
      setOpen(false);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (next) setName(faena?.name ?? "");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar faena" : "Nueva faena"}</DialogTitle>
          <DialogDescription>
            Crear una faena es excepcional: solo al empezar a atender un sitio
            nuevo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Ej. PEÑÓN"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {!isEdit && (
            // El motivo por el que existe este módulo: cuando los campamentos
            // colgaban del cliente, cada contratista se llevó su copia de los
            // mismos campamentos físicos y sus puertas terminaron con hasta 23
            // QR distintos.
            <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              <TriangleAlert className="size-4 shrink-0" />
              <span>
                Si el sitio ya existe, edítalo en vez de crear uno nuevo. Dos
                faenas para el mismo lugar duplican sus campamentos y emiten un
                segundo QR para cada puerta.
              </span>
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={createFaena.isPending || updateFaena.isPending}
            >
              {isEdit ? "Guardar" : "Crear faena"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
