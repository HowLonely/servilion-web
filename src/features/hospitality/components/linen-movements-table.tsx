"use client";

import { useState } from "react";
import { Ban, History } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PaginationBar } from "@/components/layout/pagination-bar";
import { canManageLinenStock } from "@/components/layout/nav-config";
import { formatDateTime } from "@/lib/date";
import { parseApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  MOVEMENTS_PAGE_SIZE,
  useBalances,
  useMovements,
  useVoidMovement,
} from "@/features/hospitality/hooks/use-hospitality";
import {
  MOVEMENT_KINDS,
  MOVEMENT_KIND_LABELS,
  movementKindLabel,
  movementKindTone,
} from "@/features/hospitality/lib/movements";

import type { components } from "@/lib/api/schema";

type LinenMovementOut = components["schemas"]["LinenMovementOut"];

const ALL = "__all__";

/**
 * Historial de movimientos de lencería. Es la fuente de los saldos: lo que no
 * cuadra en la tabla de saldos se explica aquí, movimiento por movimiento.
 *
 * Los anulados se muestran tachados y no desaparecen: dejan constancia de qué
 * se registró mal y quién lo corrigió.
 */
export function LinenMovementsTable() {
  const { user } = useAuth();
  const canVoid = canManageLinenStock(user?.role);
  const { data: balances } = useBalances();

  const [companyId, setCompanyId] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);
  const [offset, setOffset] = useState(0);
  const [voiding, setVoiding] = useState<LinenMovementOut | null>(null);

  const { data: page, isLoading } = useMovements({
    company_id: companyId === ALL ? undefined : Number(companyId),
    kind: kind === ALL ? undefined : kind,
    offset,
  });
  const movements = page?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Cliente</label>
          <Select
            value={companyId}
            onValueChange={(value: string) => {
              setCompanyId(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los clientes</SelectItem>
              {(balances ?? []).map((company) => (
                <SelectItem key={company.company_id} value={String(company.company_id)}>
                  {company.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <Select
            value={kind}
            onValueChange={(value: string) => {
              setKind(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los movimientos</SelectItem>
              {MOVEMENT_KINDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {MOVEMENT_KIND_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && movements.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <History className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay movimientos de lencería con estos filtros.
          </p>
        </Card>
      )}

      {movements.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Movimiento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Lencería</TableHead>
                  <TableHead className="text-right">Piezas</TableHead>
                  <TableHead>Registró</TableHead>
                  {canVoid && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <MovementRow
                    key={movement.id}
                    movement={movement}
                    canVoid={canVoid}
                    onVoid={() => setVoiding(movement)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <PaginationBar
        offset={offset}
        pageSize={MOVEMENTS_PAGE_SIZE}
        total={page?.count ?? 0}
        itemLabel="movimientos"
        onOffsetChange={setOffset}
      />

      <VoidMovementDialog movement={voiding} onClose={() => setVoiding(null)} />
    </div>
  );
}

function MovementRow({
  movement,
  canVoid,
  onVoid,
}: {
  movement: LinenMovementOut;
  canVoid: boolean;
  onVoid: () => void;
}) {
  const isCount = movement.kind === "CONTEO";
  return (
    <TableRow className={cn(movement.is_voided && "text-muted-foreground")}>
      <TableCell className="whitespace-nowrap">{formatDateTime(movement.occurred_at)}</TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              movementKindTone(movement.kind),
              movement.is_voided && "line-through opacity-60",
            )}
          >
            {movementKindLabel(movement.kind)}
          </span>
          {movement.number && <span className="font-mono text-xs">{movement.number}</span>}
          {movement.is_voided && (
            <span
              className="text-xs text-destructive"
              title={`Anulado por ${movement.voided_by_name}: ${movement.void_reason}`}
            >
              Anulado · {movement.void_reason}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{movement.company_name}</TableCell>
      <TableCell>{movement.location_name}</TableCell>
      <TableCell className={cn(movement.is_voided && "line-through")}>
        <ul className="flex flex-col gap-0.5 text-sm">
          {movement.lines.map((line) => (
            <li key={line.garment_type_id}>
              {line.name}: <span className="font-semibold tabular-nums">{line.quantity}</span>
              {isCount && line.difference !== null && line.difference !== 0 && (
                <span
                  className={cn(
                    "ml-1 text-xs tabular-nums",
                    line.difference < 0 ? "text-destructive" : "text-emerald-600",
                  )}
                >
                  ({line.difference > 0 ? "+" : ""}
                  {line.difference})
                </span>
              )}
            </li>
          ))}
        </ul>
      </TableCell>
      <TableCell
        className={cn("text-right font-semibold tabular-nums", movement.is_voided && "line-through")}
      >
        {isCount ? "—" : movement.total_quantity.toLocaleString("es-CL")}
      </TableCell>
      <TableCell>{movement.registered_by_name || "—"}</TableCell>
      {canVoid && (
        <TableCell>
          {!movement.is_voided && (
            <Button variant="ghost" size="sm" onClick={onVoid}>
              <Ban className="size-4" />
              Anular
            </Button>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}

function VoidMovementDialog({
  movement,
  onClose,
}: {
  movement: LinenMovementOut | null;
  onClose: () => void;
}) {
  const voidMovement = useVoidMovement();
  const [reason, setReason] = useState("");

  async function submit() {
    if (!movement) return;
    try {
      await voidMovement.mutateAsync({ id: movement.id, reason });
      toast.success("Movimiento anulado. Los saldos ya no lo consideran.");
      setReason("");
      onClose();
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Dialog
      open={movement !== null}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular movimiento</DialogTitle>
          <DialogDescription>
            {movement &&
              `${movementKindLabel(movement.kind)} · ${movement.location_name} · ${formatDateTime(movement.occurred_at)}. `}
            No se borra: queda en el historial marcado como anulado y deja de contar en los
            saldos. Si estaba mal, registra después el movimiento correcto.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Motivo (ej. registrado dos veces)"
          value={reason}
          maxLength={200}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || voidMovement.isPending}
            onClick={() => void submit()}
          >
            Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
