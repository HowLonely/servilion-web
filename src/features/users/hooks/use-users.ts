import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];
export type StaffUserOut = Schemas["StaffUserOut"];
export type StaffUserCreateIn = Schemas["StaffUserCreateIn"];
export type StaffUserUpdateIn = Schemas["StaffUserUpdateIn"];
export type RoleOut = Schemas["RoleOut"];
export type RoleIn = Schemas["RoleIn"];
export type PermissionOut = Schemas["PermissionOut"];

export const USERS_PAGE_SIZE = 25;

export const usersKeys = {
  all: ["users"] as const,
  list: (filters: UserFilters) => ["users", "list", filters] as const,
  roles: ["roles"] as const,
  permissions: ["roles", "permissions"] as const,
};

export type UserFilters = {
  search?: string;
  role?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
};

export function useStaffUsers(filters: UserFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/users/", { params: { query: filters } });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StaffUserCreateIn) => {
      const { data, error } = await api.POST("/api/users/", { body });
      if (error) throw parseApiError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.roles });
    },
  });
}

export function useUpdateStaffUser(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StaffUserUpdateIn) => {
      const { data, error } = await api.PUT("/api/users/{user_id}", {
        params: { path: { user_id: userId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.roles });
    },
  });
}

export function useSetStaffPassword(userId: number) {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await api.POST("/api/users/{user_id}/password", {
        params: { path: { user_id: userId } },
        body: { password },
      });
      if (error) throw parseApiError(error);
      return data;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: usersKeys.roles,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/roles/");
      if (error) throw error;
      return data;
    },
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: usersKeys.permissions,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/roles/permissions");
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });
}

export function useSaveRole(roleId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoleIn) => {
      if (roleId === null) {
        const { data, error } = await api.POST("/api/roles/", { body });
        if (error) throw parseApiError(error);
        return data;
      }
      const { data, error } = await api.PUT("/api/roles/{role_id}", {
        params: { path: { role_id: roleId } },
        body,
      });
      if (error) throw parseApiError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.roles });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: number) => {
      const { error } = await api.DELETE("/api/roles/{role_id}", {
        params: { path: { role_id: roleId } },
      });
      if (error) throw parseApiError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.roles });
    },
  });
}
