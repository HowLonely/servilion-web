import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type BillingReportRequestIn = components["schemas"]["BillingReportRequestIn"];

const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILURE"]);

export function useRequestBillingReport() {
  return useMutation({
    mutationFn: async (body: BillingReportRequestIn) => {
      const { data, error } = await api.POST("/api/orders/reports/billing", { body });
      if (error) throw parseApiError(error);
      return data;
    },
  });
}

export function useBillingReportTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ["billing-report", taskId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/reports/billing/{task_id}", {
        params: { path: { task_id: taskId! } },
      });
      if (error) throw parseApiError(error);
      return data;
    },
    enabled: taskId !== undefined,
    refetchInterval: (query) =>
      TERMINAL_STATUSES.has(query.state.data?.status ?? "") ? false : 2000,
  });
}
