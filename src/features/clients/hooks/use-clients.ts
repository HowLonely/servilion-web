import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type ClientOut = components["schemas"]["ClientOut"];
type ClientIn = components["schemas"]["ClientIn"];
type ClientPriceSetIn = components["schemas"]["ClientPriceSetIn"];

export type ClientFilters = {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

export const clientsKeys = {
  all: ["clients"] as const,
  list: (filters: ClientFilters) => ["clients", "list", filters] as const,
  detail: (id: number) => ["clients", "detail", id] as const,
  prices: (id: number) => ["clients", "prices", id] as const,
};

// El listado del backend está paginado (limit/offset).
export const CLIENTS_PAGE_SIZE = 25;

// Tope de resultados para selectores (dropdown de filtro, formularios).
export const CLIENTS_SELECT_LIMIT = 100;

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: clientsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/clients/", {
        params: { query: filters },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useClient(clientId: number | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(clientId ?? -1),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/clients/{client_id}", {
        params: { path: { client_id: clientId! } },
      });
      if (error) throw error;
      return data;
    },
    enabled: clientId !== undefined,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClientIn) => {
      const { data, error } = await api.POST("/api/clients/", { body });
      if (error) throw parseApiError(error);
      return data as ClientOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClient(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClientIn) => {
      const { data, error } = await api.PUT("/api/clients/{client_id}", {
        params: { path: { client_id: clientId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data as ClientOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: number) => {
      const { error } = await api.DELETE("/api/clients/{client_id}", {
        params: { path: { client_id: clientId } },
      });
      if (error) throw parseApiError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

// --- Catálogo de precios por cliente ---------------------------------------

export function useClientPrices(clientId: number | undefined) {
  return useQuery({
    queryKey: clientsKeys.prices(clientId ?? -1),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/clients/{client_id}/prices", {
        params: { path: { client_id: clientId! } },
      });
      if (error) throw error;
      return data;
    },
    enabled: clientId !== undefined,
  });
}

export function useSetClientPrices(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ClientPriceSetIn) => {
      const { data, error } = await api.PUT("/api/clients/{client_id}/prices", {
        params: { path: { client_id: clientId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.prices(clientId) });
    },
  });
}
