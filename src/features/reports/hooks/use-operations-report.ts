import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

// Torre de Control Operacional (Dashboard 1). Todos los endpoints son de
// agregación en tiempo real: se refrescan por polling (React Query
// `refetchInterval`), no por WebSocket. Las cadencias replican el contrato
// (ai_context/REPORTES_API_CONTRACT.md §0): el resumen es lo más "vivo", la
// serie temporal cambia despacio.
export const SUMMARY_REFETCH_MS = 20_000;
export const STALLED_REFETCH_MS = 30_000;
export const TIMESERIES_REFETCH_MS = 120_000;

export const STALLED_PAGE_SIZE = 25;

export const operationsKeys = {
  all: ["reports", "operations"] as const,
  summary: (companyId?: number) =>
    ["reports", "operations", "summary", companyId ?? null] as const,
  stalled: (companyId: number | undefined, offset: number) =>
    ["reports", "operations", "stalled", companyId ?? null, offset] as const,
  timeseries: (companyId: number | undefined, from: string, to: string) =>
    ["reports", "operations", "timeseries", companyId ?? null, from, to] as const,
};

// El filtro por empresa es la dimensión principal (la faena no es una entidad
// del modelo). `undefined` = todas las empresas.
export function useOperationsSummary(companyId?: number) {
  return useQuery({
    queryKey: operationsKeys.summary(companyId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/reports/operations/summary", {
        params: { query: { company_id: companyId } },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: SUMMARY_REFETCH_MS,
    placeholderData: keepPreviousData,
  });
}

export function useStalledOrders(companyId: number | undefined, offset: number) {
  return useQuery({
    queryKey: operationsKeys.stalled(companyId, offset),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/reports/operations/stalled", {
        params: {
          query: {
            company_id: companyId,
            limit: STALLED_PAGE_SIZE,
            offset,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: STALLED_REFETCH_MS,
    placeholderData: keepPreviousData,
  });
}

export function useOperationsTimeseries(
  companyId: number | undefined,
  dateFrom: string,
  dateTo: string,
) {
  return useQuery({
    queryKey: operationsKeys.timeseries(companyId, dateFrom, dateTo),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/reports/operations/timeseries", {
        params: {
          query: { company_id: companyId, date_from: dateFrom, date_to: dateTo },
        },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: TIMESERIES_REFETCH_MS,
    placeholderData: keepPreviousData,
  });
}
