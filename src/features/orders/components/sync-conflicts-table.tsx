"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderNumberLabel } from "@/features/orders/components/order-number-label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { parseApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/date";
import { PaginationBar } from "@/components/layout/pagination-bar";
import {
  SYNC_CONFLICTS_PAGE_SIZE,
  useResolveSyncConflict,
  useSyncConflicts,
} from "@/features/orders/hooks/use-sync-conflicts";

import type { components } from "@/lib/api/schema";

type SyncConflictOut = components["schemas"]["SyncConflictOut"];

// La sincronización offline resuelve conflictos por last-write-wins, pero el
// cambio perdedor no se descarta en silencio: con turnos rotativos dos
// dispositivos pueden editar la misma guía offline durante días, y el
// supervisor necesita ver qué se descartó (FLUJO_NEGOCIO.md §7).
export function SyncConflictsTable() {
  const [onlyPending, setOnlyPending] = useState(true);
  const [offset, setOffset] = useState(0);
  const { data, isLoading, error } = useSyncConflicts(
    onlyPending ? false : undefined,
    offset,
  );
  const total = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant={onlyPending ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setOnlyPending(true);
            setOffset(0);
          }}
        >
          Sin revisar
        </Button>
        <Button
          variant={onlyPending ? "outline" : "default"}
          size="sm"
          onClick={() => {
            setOnlyPending(false);
            setOffset(0);
          }}
        >
          Todos
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Trabajador</TableHead>
              <TableHead>Versión del dispositivo</TableHead>
              <TableHead>Versión del servidor</TableHead>
              <TableHead>Detectado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-destructive">
                  No se pudieron cargar los conflictos.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && data?.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No hay conflictos de sincronización.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((conflict) => (
              <TableRow key={conflict.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/orders/${conflict.order_id}`}
                    className="hover:underline"
                  >
                    <OrderNumberLabel value={conflict.order_number} />
                  </Link>
                </TableCell>
                <TableCell>{conflict.worker_name}</TableCell>
                <TableCell>
                  {formatDateTime(conflict.device_updated_at)}
                </TableCell>
                <TableCell>
                  {formatDateTime(conflict.server_updated_at)}
                </TableCell>
                <TableCell>{formatDateTime(conflict.created_at)}</TableCell>
                <TableCell>
                  <Badge
                    variant={conflict.resolved_at ? "outline" : "destructive"}
                  >
                    {conflict.resolved_at ? "Revisado" : "Sin revisar"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ConflictDetailDialog conflict={conflict} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={SYNC_CONFLICTS_PAGE_SIZE}
        total={total}
        itemLabel="conflictos"
        onOffsetChange={setOffset}
      />
    </div>
  );
}

function ConflictDetailDialog({ conflict }: { conflict: SyncConflictOut }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const resolve = useResolveSyncConflict();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ver cambio descartado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Cambio descartado de la OT {conflict.order_number}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          El dispositivo envió una versión del {formatDateTime(conflict.device_updated_at)},
          más antigua que la del servidor ({formatDateTime(conflict.server_updated_at)}),
          así que no se aplicó.
        </p>
        <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(conflict.discarded_payload, null, 2)}
        </pre>
        {conflict.resolved_at ? (
          <p className="text-sm text-muted-foreground">
            Revisado el {formatDateTime(conflict.resolved_at)}
            {conflict.resolution_note ? `: ${conflict.resolution_note}` : "."}
          </p>
        ) : (
          <>
            <Textarea
              placeholder="Qué se hizo con este cambio..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <DialogFooter>
              <Button
                disabled={resolve.isPending || note.trim().length === 0}
                onClick={async () => {
                  try {
                    await resolve.mutateAsync({ id: conflict.id, note });
                    toast.success("Conflicto marcado como revisado.");
                    setOpen(false);
                    setNote("");
                  } catch (error) {
                    toast.error(parseApiError(error).detail);
                  }
                }}
              >
                Marcar como revisado
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
