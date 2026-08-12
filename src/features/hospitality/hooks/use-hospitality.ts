import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type LinenBatchOut = components["schemas"]["LinenBatchOut"];
type LinenBatchIn = components["schemas"]["LinenBatchIn"];
type ReturnCountIn = components["schemas"]["ReturnCountIn"];

export type BatchFilters = {
  status?: string;
  company_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export const hospitalityKeys = {
  all: ["hospitality"] as const,
  list: (filters: BatchFilters) => ["hospitality", "list", filters] as const,
  detail: (id: number) => ["hospitality", "detail", id] as const,
  note: (id: number) => ["hospitality", "note", id] as const,
  counters: ["hospitality", "counters"] as const,
};

export const BATCHES_PAGE_SIZE = 25;

export function useBatches(filters: BatchFilters) {
  return useQuery({
    queryKey: hospitalityKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/", {
        params: { query: { limit: BATCHES_PAGE_SIZE, ...filters } },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useBatch(batchId: number | undefined) {
  return useQuery({
    queryKey: hospitalityKeys.detail(batchId ?? -1),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/{batch_id}", {
        params: { path: { batch_id: batchId! } },
      });
      if (error) throw error;
      return data;
    },
    enabled: batchId !== undefined,
  });
}

export function useBatchNote(batchId: number) {
  return useQuery({
    queryKey: hospitalityKeys.note(batchId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/{batch_id}/note", {
        params: { path: { batch_id: batchId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useHospitalityCounters() {
  return useQuery({
    queryKey: hospitalityKeys.counters,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/hospitality/counters");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LinenBatchIn) => {
      const { data, error } = await api.POST("/api/hospitality/", { body });
      if (error) throw parseApiError(error);
      return data as LinenBatchOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hospitalityKeys.all });
    },
  });
}

/**
 * Cuenta de salida del lote: cuántas piezas de cada tipo volvieron del lavado.
 * Es repetible mientras el lote no se despache, porque contar cientos de
 * sábanas admite corrección.
 */
export function useRegisterReturnCount(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (counts: ReturnCountIn[]) => {
      const { data, error } = await api.POST(
        "/api/hospitality/{batch_id}/return-count",
        { params: { path: { batch_id: batchId } }, body: { counts } },
      );
      if (error) throw parseApiError(error);
      return data as LinenBatchOut;
    },
    onSuccess: (batch) => {
      queryClient.setQueryData(hospitalityKeys.detail(batchId), batch);
      queryClient.invalidateQueries({ queryKey: hospitalityKeys.counters });
      queryClient.invalidateQueries({ queryKey: ["hospitality", "list"] });
    },
  });
}

export function useDispatchBatch(batchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { received_by_client: string; note: string }) => {
      const { data, error } = await api.POST(
        "/api/hospitality/{batch_id}/dispatch",
        { params: { path: { batch_id: batchId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as LinenBatchOut;
    },
    onSuccess: (batch) => {
      queryClient.setQueryData(hospitalityKeys.detail(batchId), batch);
      queryClient.invalidateQueries({ queryKey: hospitalityKeys.all });
    },
  });
}
