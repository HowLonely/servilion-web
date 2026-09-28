import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type WeighingSettingsIn = components["schemas"]["WeighingSettingsIn"];
type WeighingSettingsOut = components["schemas"]["WeighingSettingsOut"];

export const weighingSettingsKeys = {
  all: ["weighing-settings"] as const,
  settings: ["weighing-settings", "settings"] as const,
  expressQuota: ["weighing-settings", "express-quota"] as const,
};

export function useWeighingSettings() {
  return useQuery({
    queryKey: weighingSettingsKeys.settings,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/weighing/settings");
      if (error) throw error;
      return data;
    },
  });
}

/** Cargos express usados en el mes y el límite vigente (el mismo contador de la báscula). */
export function useExpressQuota() {
  return useQuery({
    queryKey: weighingSettingsKeys.expressQuota,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/weighing/express-quota");
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useUpdateWeighingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: WeighingSettingsIn) => {
      const { data, error } = await api.PUT("/api/weighing/settings", { body });
      if (error) throw parseApiError(error);
      return data as WeighingSettingsOut;
    },
    onSuccess: () => {
      // El límite nuevo cambia también el "restante" del contador.
      queryClient.invalidateQueries({ queryKey: weighingSettingsKeys.all });
    },
  });
}
