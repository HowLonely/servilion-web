import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

export const syncConflictsKeys = {
  all: ["sync-conflicts"] as const,
  list: (resolved: boolean | undefined, offset: number) =>
    ["sync-conflicts", "list", resolved ?? "todos", offset] as const,
};

// El listado del backend está paginado (limit/offset).
export const SYNC_CONFLICTS_PAGE_SIZE = 25;

// Cambios que la app móvil intentó sincronizar y el servidor descartó por ser
// más antiguos. Se listan para que un supervisor decida qué hacer, en vez de
// perderlos en silencio (ver FLUJO_NEGOCIO.md §7).
export function useSyncConflicts(resolved: boolean | undefined, offset = 0) {
  return useQuery({
    queryKey: syncConflictsKeys.list(resolved, offset),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/sync-conflicts", {
        params: {
          query: {
            ...(resolved === undefined ? {} : { resolved }),
            limit: SYNC_CONFLICTS_PAGE_SIZE,
            offset,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useResolveSyncConflict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      const { data, error } = await api.POST(
        "/api/orders/sync-conflicts/{conflict_id}/resolve",
        { params: { path: { conflict_id: id } }, body: { note } },
      );
      if (error) throw parseApiError(error);
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncConflictsKeys.all });
    },
  });
}
