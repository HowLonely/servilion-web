"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { parseApiError } from "@/lib/api/errors";
import {
  useDeleteRole,
  usePermissionCatalog,
  useRoles,
  useSaveRole,
  type PermissionOut,
  type RoleOut,
} from "@/features/users/hooks/use-users";

/**
 * Roles y sus permisos. Cambiar un rol afecta a todos sus usuarios en la web,
 * la terminal de planta y la app móvil. El rol Administrador tiene siempre
 * todos los permisos y no se edita.
 */
export function RolesList() {
  const { data: roles, isLoading } = useRoles();
  const { data: catalog } = usePermissionCatalog();
  const [editing, setEditing] = useState<RoleOut | "new" | null>(null);

  const labels = useMemo(
    () => Object.fromEntries((catalog ?? []).map((permission) => [permission.code, permission.label])),
    [catalog],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>Nuevo rol</Button>
      </div>

      {isLoading && <Skeleton className="h-48 w-full" />}

      <div className="grid gap-4 md:grid-cols-2">
        {roles?.map((role) => (
          <Card key={role.id} className={role.is_active ? undefined : "opacity-60"}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  {role.name}
                  {role.is_superrole && <Lock className="size-4 text-muted-foreground" />}
                </CardTitle>
                {role.description && <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">
                  {role.user_count} {role.user_count === 1 ? "usuario" : "usuarios"}
                </Badge>
                {!role.is_superrole && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(role)}>
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {role.is_superrole ? (
                <Badge variant="secondary">Todos los permisos</Badge>
              ) : role.permissions.length === 0 ? (
                <span className="text-sm text-muted-foreground">Sin permisos</span>
              ) : (
                role.permissions.map((code) => (
                  <Badge key={code} variant="secondary">
                    {labels[code] ?? code}
                  </Badge>
                ))
              )}
              {!role.is_active && <Badge variant="outline">Inactivo</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {editing !== null && catalog && (
        <RoleDialog role={editing === "new" ? null : editing} catalog={catalog} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function RoleDialog({
  role,
  catalog,
  onClose,
}: {
  role: RoleOut | null;
  catalog: PermissionOut[];
  onClose: () => void;
}) {
  const save = useSaveRole(role?.id ?? null);
  const remove = useDeleteRole();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isActive, setIsActive] = useState(role?.is_active ?? true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role?.permissions ?? []));

  const groups = useMemo(() => {
    const byGroup = new Map<string, PermissionOut[]>();
    for (const permission of catalog) {
      byGroup.set(permission.group, [...(byGroup.get(permission.group) ?? []), permission]);
    }
    return [...byGroup.entries()];
  }, [catalog]);

  function toggle(code: string, checked: boolean) {
    setPermissions((previous) => {
      const next = new Set(previous);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({ name, description, permissions: [...permissions], is_active: isActive });
      toast.success(role ? "Rol actualizado." : "Rol creado.");
      onClose();
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  async function handleDelete() {
    if (!role) return;
    try {
      await remove.mutateAsync(role.id);
      toast.success("Rol eliminado.");
      onClose();
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? `Rol: ${role.name}` : "Nuevo rol"}</DialogTitle>
          <DialogDescription>Marca lo que pueden hacer los usuarios con este rol.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role_name">Nombre</Label>
              <Input id="role_name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role_description">Descripción (opcional)</Label>
              <Input
                id="role_description"
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {groups.map(([group, items]) => (
            <fieldset key={group} className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-muted-foreground">{group}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((permission) => (
                  <label key={permission.code} className="flex items-start gap-3 rounded-lg border p-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-primary"
                      checked={permissions.has(permission.code)}
                      onChange={(event) => toggle(permission.code, event.target.checked)}
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{permission.label}</span>
                      <span className="text-xs text-muted-foreground">{permission.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {role && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Rol activo (un rol inactivo no otorga permisos)
            </label>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {role && !role.is_system ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={remove.isPending || role.user_count > 0}
                onClick={handleDelete}
              >
                {role.user_count > 0 ? "Tiene usuarios: no se puede borrar" : "Borrar rol"}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
