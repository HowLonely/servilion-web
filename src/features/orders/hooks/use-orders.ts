import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type LaundryOrderOut = components["schemas"]["LaundryOrderOut"];
type LaundryOrderIn = components["schemas"]["LaundryOrderIn"];
type PackingProgressOut = components["schemas"]["PackingProgressOut"];
type PackingScanOut = components["schemas"]["PackingScanOut"];
type AmbiguousReferenceOut = components["schemas"]["AmbiguousReferenceOut"];

export type OrderFilters = {
  status?: string;
  company_id?: number;
  client_id?: number;
  worker_id?: number;
  search?: string;
  date_from: string;
  date_to: string;
  limit?: number;
  offset?: number;
};

export const ordersKeys = {
  all: ["orders"] as const,
  list: (filters: OrderFilters) => ["orders", "list", filters] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
  packing: (id: number) => ["orders", "packing", id] as const,
  receipt: (id: number) => ["orders", "receipt", id] as const,
  labels: (id: number) => ["orders", "labels", id] as const,
  counters: ["orders", "counters"] as const,
};

// El listado del backend está paginado (limit/offset): el histórico legado ronda
// las 280.000 guías, así que nunca se piden todas.
export const ORDERS_PAGE_SIZE = 25;

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ordersKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/", {
        params: { query: { limit: ORDERS_PAGE_SIZE, ...filters } },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useOrder(orderId: number | undefined) {
  return useQuery({
    queryKey: ordersKeys.detail(orderId ?? -1),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/{order_id}", {
        params: { path: { order_id: orderId! } },
      });
      if (error) throw error;
      return data;
    },
    enabled: orderId !== undefined,
  });
}

export function useOrderReceipt(orderId: number) {
  return useQuery({
    queryKey: ordersKeys.receipt(orderId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/{order_id}/receipt", {
        params: { path: { order_id: orderId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// Contadores ENTREGADOS / DESPACHADOS de la operación en faena.
export function useOrderCounters() {
  return useQuery({
    queryKey: ordersKeys.counters,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/counters");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LaundryOrderIn) => {
      const { data, error } = await api.POST("/api/orders/", { body });
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useUpdateOrderStatus(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { status: string; note: string }) => {
      const { data, error } = await api.PATCH("/api/orders/{order_id}/status", {
        params: { path: { order_id: orderId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

// Resuelve una guía a partir de un código pistoleado (ref, OT o control). La usa
// la estación de empaque para abrir el morral al escanear cualquier prenda.
export function useFindOrderByCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await api.GET("/api/orders/scan/{code}", {
        params: { path: { code } },
      });
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
  });
}

// Etiquetas lavables a imprimir, una por prenda declarada en la guía. Se pegan
// a cada prenda al digitalizar la OT y son las que se pistolean al empacar.
export function useGarmentLabels(orderId: number) {
  return useQuery({
    queryKey: ordersKeys.labels(orderId),
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/orders/{order_id}/garment-labels",
        { params: { path: { order_id: orderId } } },
      );
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Pistoleo único de la mesa de empaque: un solo código resuelve todo.
 *
 * La boleta abre el morral y lo cierra; la etiqueta lavable de una prenda abre
 * el morral (si hacía falta) y marca la prenda en el mismo disparo. El backend
 * decide la acción, así que aquí no hay modos ni estado que sincronizar. El
 * despacho (paso 7) es un módulo aparte, ver `useDispatchScan`.
 */
export function usePackingCodeScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { code: string; quantity: number }) => {
      const { data, error } = await api.POST("/api/orders/scan/packing", {
        body,
      });
      // `parseApiError` devuelve el cuerpo tal cual, así que el 409 conserva
      // sus `candidates` para que la UI ofrezca elegir (ver isAmbiguousReference).
      if (error) throw parseApiError(error);
      return data as PackingScanOut;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ordersKeys.packing(result.order.id),
        result.progress,
      );
      queryClient.invalidateQueries({
        queryKey: ordersKeys.detail(result.order.id),
      });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

/**
 * El 409 del pistoleo no es un error a mostrar y ya: el `ref` se resetea cada
 * semana, así que puede calzar con más de un morral abierto. El backend manda
 * las guías candidatas para que el operador reconozca la suya por trabajador y
 * empresa, que es lo que tiene a la vista.
 */
export function isAmbiguousReference(
  error: unknown,
): error is AmbiguousReferenceOut {
  return (
    !!error &&
    typeof error === "object" &&
    "candidates" in error &&
    Array.isArray((error as AmbiguousReferenceOut).candidates)
  );
}

// La recepción en lavandería no es una acción aparte: ocurre al ingresar la
// guía (`useCreateOrder` fija `laundry_received_at`), así que no hay hook manual.

// --- Paso 6: pistoleo de empaque del morral limpio ---

export function usePackingProgress(orderId: number, enabled: boolean) {
  return useQuery({
    queryKey: ordersKeys.packing(orderId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/orders/{order_id}/packing", {
        params: { path: { order_id: orderId } },
      });
      if (error) throw error;
      return data;
    },
    enabled,
  });
}

export function usePackingScan(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { code: string; quantity: number }) => {
      const { data, error } = await api.POST(
        "/api/orders/{order_id}/packing/scan",
        { params: { path: { order_id: orderId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as PackingProgressOut;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(ordersKeys.packing(orderId), data);
    },
  });
}

export function useFinishPacking(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { note: string }) => {
      const { data, error } = await api.POST(
        "/api/orders/{order_id}/packing/finish",
        { params: { path: { order_id: orderId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

// Despacha a faena un morral ya cerrado (paso 7), por id. La usa el módulo
// Despacho para resolver un empate de ref (ver DispatchAmbiguityPicker),
// igual que useFinishPacking es el equivalente por id del segundo disparo.
export function useDispatchOrder(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { note: string }) => {
      const { data, error } = await api.POST(
        "/api/orders/{order_id}/dispatch",
        { params: { path: { order_id: orderId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/**
 * Pistoleo único del módulo Despacho (paso 7): resuelve la boleta y despacha
 * directo, en un solo disparo. Espejo de `usePackingCodeScan`, pero sin ciclo
 * de abrir/cerrar. El 409 (`isAmbiguousReference`) se maneja igual.
 */
export function useDispatchScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { code: string; note: string }) => {
      const { data, error } = await api.POST("/api/orders/scan/dispatch", {
        body,
      });
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}

// Resuelve una prenda que faltó al empacar (guía INCOMPLETA o ya despachada
// con el faltante a bordo): encontrada (con su código) o comprada (con su
// costo). Ver MissingItemResolution.
export function useResolveMissingItem(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      item_id: number;
      resolution_type: "ENCONTRADA" | "COMPRADA";
      quantity: number;
      code: string;
      purchase_cost: number | null;
      note: string;
    }) => {
      const { data, error } = await api.POST(
        "/api/orders/{order_id}/incomplete/resolve",
        { params: { path: { order_id: orderId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.packing(orderId) });
    },
  });
}

// --- Paso 8: recepción del morral limpio en faena ---

export function useCleanReception(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { note: string }) => {
      const { data, error } = await api.POST(
        "/api/orders/{order_id}/clean-reception",
        { params: { path: { order_id: orderId } }, body },
      );
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

// --- Paso 9: entrega en habitación ---

export function useRegisterDelivery(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { note: string }) => {
      const { data, error } = await api.POST("/api/orders/{order_id}/deliver", {
        params: { path: { order_id: orderId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data as LaundryOrderOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
