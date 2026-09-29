import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type CountIn = components["schemas"]["CountIn"];
type LinenMovementOut = components["schemas"]["LinenMovementOut"];

export type MovementFilters = {
  company_id?: number;
  camp_id?: number;
  kind?: string;
  include_voided?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export const hospitalityKeys = {
  all: ["hospitality"] as const,
  balances: ["hospitality", "balances"] as const,
  movements: (filters: MovementFilters) => ["hospitality", "movements", filters] as const,
};

export const MOVEMENTS_PAGE_SIZE = 25;

/**
 * Saldo de hotelería de todos los clientes de hotelería.
 *
 * Se pide completo y no por cliente: los contratos de hotelería son un puñado,
 * y con una sola respuesta alcanza para la tabla de saldos, los selectores de
 * cliente y lugar del conteo, y el catálogo de tipos de cada cliente.
 */
export function useBalances() {
  return useQuery({
    queryKey: hospitalityKeys.balances,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/balances");
      if (error) throw error;
      return data;
    },
  });
}

export function useMovements(filters: MovementFilters) {
  return useQuery({
    queryKey: hospitalityKeys.movements(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/movements", {
        params: { query: { limit: MOVEMENTS_PAGE_SIZE, ...filters } },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useRegisterCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CountIn) => {
      const { data, error } = await api.POST("/api/hospitality/counts", { body });
      if (error) throw parseApiError(error);
      return data as LinenMovementOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hospitalityKeys.all });
    },
  });
}

export function useVoidMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const { data, error } = await api.POST("/api/hospitality/movements/{movement_id}/void", {
        params: { path: { movement_id: id } },
        body: { reason },
      });
      if (error) throw parseApiError(error);
      return data as LinenMovementOut;
    },
    onSuccess: () => {
      // Anular cambia el historial y también los saldos.
      queryClient.invalidateQueries({ queryKey: hospitalityKeys.all });
    },
  });
}
