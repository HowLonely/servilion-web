import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

// Matriz comparativa de precios: todas las prendas × todos los clientes. El
// precio vive por cliente (companies.ClientGarmentPrice), no en el catálogo
// global de prendas, así que esta vista cruza ambos para comparar tarifas.
export const priceMatrixKey = ["garments", "price-matrix"] as const;

export function usePriceMatrix() {
  return useQuery({
    queryKey: priceMatrixKey,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/clients/price-matrix");
      if (error) throw error;
      return data;
    },
  });
}
