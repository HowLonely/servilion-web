"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/date";

const ISSUES_PAGE_SIZE = 25;

const ISSUE_LABELS: Record<string, string> = {
  DESCARTADO: "Edición descartada",
  RENOMBRADO: "Nombre duplicado",
  DUPLICADO: "Registro duplicado",
  ERROR: "Error",
};

/**
 * Servidores locales de planta: si están conectados y cuánto tienen por
 * enviar. La operación de planta llega a esta web a través de ellos, así que un
 * servidor desconectado explica por qué una guía todavía no aparece aquí.
 */
export function LocalServerStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["sync", "status"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/sync/status");
      if (error) throw error;
      return data;
    },
    refetchInterval: 15_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servidores locales de planta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoading && <Skeleton className="h-10 w-full" />}
        {status && status.nodes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay servidores locales registrados. Se registran con{" "}
            <code className="rounded bg-muted px-1">manage.py sync_register_node</code>.
          </p>
        )}
        {status?.nodes.map((node) => (
          <div key={node.name} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm">
            <span className="font-medium">{node.name}</span>
            <Badge variant={node.online ? "secondary" : "destructive"}>
              {node.online ? "Conectado" : "Sin conexión"}
            </Badge>
            <span className="text-muted-foreground">
              Último envío: {node.last_push_at ? formatDateTime(node.last_push_at) : "—"}
            </span>
            <span className="text-muted-foreground">
              Última lectura: {node.last_pull_at ? formatDateTime(node.last_pull_at) : "—"}
            </span>
            {node.pending_changes > 0 && (
              <Badge variant="outline">{node.pending_changes} cambios por enviar</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Lo que la sincronización nube ⇄ planta resolvió sola con su regla fija:
 * ediciones simultáneas (gana la más reciente), nombres duplicados creados sin
 * conexión (se renombra el segundo) y filas que no se pudieron aplicar.
 */
export function SyncIssuesTable() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [showResolved, setShowResolved] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ["sync", "issues", showResolved, offset],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/sync/issues", {
        params: { query: { resolved: showResolved ? undefined : false, limit: ISSUES_PAGE_SIZE, offset } },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });

  const resolve = useMutation({
    mutationFn: async (issueId: number) => {
      const { error } = await api.POST("/api/sync/issues/{issue_id}/resolve", {
        params: { path: { issue_id: issueId } },
      });
      if (error) throw parseApiError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sync", "issues"] }),
    onError: (error) => toast.error(parseApiError(error).detail),
  });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={showResolved}
          onChange={(event) => {
            setShowResolved(event.target.checked);
            setOffset(0);
          }}
        />
        Mostrar revisadas
      </label>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && page?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay incidencias pendientes.
                </TableCell>
              </TableRow>
            )}
            {page?.items.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(issue.created_at)}</TableCell>
                <TableCell>
                  <Badge variant={issue.kind === "ERROR" ? "destructive" : "secondary"}>
                    {ISSUE_LABELS[issue.kind] ?? issue.kind}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {issue.table}#{issue.row_id}
                </TableCell>
                <TableCell className="max-w-md text-sm">{issue.detail}</TableCell>
                <TableCell>
                  {!issue.resolved_at && (
                    <Button variant="ghost" size="sm" onClick={() => resolve.mutate(issue.id)}>
                      Marcar revisada
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        offset={offset}
        pageSize={ISSUES_PAGE_SIZE}
        total={page?.count ?? 0}
        itemLabel="incidencias"
        onOffsetChange={setOffset}
      />
    </div>
  );
}
