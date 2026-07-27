import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type CampOut = components["schemas"]["CampOut"];
type CampIn = components["schemas"]["CampIn"];
type RoomOut = components["schemas"]["RoomOut"];
type RoomIn = components["schemas"]["RoomIn"];

export type CampFilters = {
  client_id?: number;
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

export type RoomFilters = {
  camp_id?: number;
  client_id?: number;
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

export const campsKeys = {
  all: ["camps"] as const,
  list: (filters: CampFilters) => ["camps", "list", filters] as const,
};

export const roomsKeys = {
  all: ["rooms"] as const,
  list: (filters: RoomFilters) => ["rooms", "list", filters] as const,
};

export const CAMPS_PAGE_SIZE = 25;
// Tope para selectores: una faena tiene decenas de camps, no miles.
export const CAMPS_SELECT_LIMIT = 100;
// Un camp sí puede tener cientos de piezas, así que el selector de
// habitación filtra siempre por camp antes de listar.
export const ROOMS_SELECT_LIMIT = 300;

// --- Campamentos ---

export function useCamps(filters: CampFilters = {}) {
  return useQuery({
    queryKey: campsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/camps/", {
        params: { query: filters },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreateCamp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CampIn) => {
      const { data, error } = await api.POST("/api/camps/", { body });
      if (error) throw parseApiError(error);
      return data as CampOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campsKeys.all });
    },
  });
}

export function useUpdateCamp(campId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CampIn) => {
      const { data, error } = await api.PUT("/api/camps/{camp_id}", {
        params: { path: { camp_id: campId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data as CampOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campsKeys.all });
    },
  });
}

export function useDeactivateCamp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campId: number) => {
      const { error } = await api.DELETE("/api/camps/{camp_id}", {
        params: { path: { camp_id: campId } },
      });
      if (error) throw parseApiError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campsKeys.all });
      // Dar de baja un camp oculta también sus rooms del selector.
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}

// --- Habitaciones ---

export function useRooms(
  filters: RoomFilters = {},
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: roomsKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/rooms/", {
        params: { query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoomIn) => {
      const { data, error } = await api.POST("/api/rooms/", { body });
      if (error) throw parseApiError(error);
      return data as RoomOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
      // El contador de rooms del camp queda obsoleto.
      queryClient.invalidateQueries({ queryKey: campsKeys.all });
    },
  });
}

export function useUpdateRoom(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoomIn) => {
      const { data, error } = await api.PUT("/api/rooms/{room_id}", {
        params: { path: { room_id: roomId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data as RoomOut;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}

export function useDeactivateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => {
      const { error } = await api.DELETE("/api/rooms/{room_id}", {
        params: { path: { room_id: roomId } },
      });
      if (error) throw parseApiError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
      queryClient.invalidateQueries({ queryKey: campsKeys.all });
    },
  });
}
