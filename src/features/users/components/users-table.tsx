"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/layout/pagination-bar";
import { parseApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  USERS_PAGE_SIZE,
  useCreateStaffUser,
  useRoles,
  useSetStaffPassword,
  useStaffUsers,
  useUpdateStaffUser,
  type RoleOut,
  type StaffUserOut,
} from "@/features/users/hooks/use-users";

/**
 * Usuarios del staff. El rol decide qué puede hacer cada uno en la web, en la
 * terminal de planta y en la app móvil. Los usuarios también se crean desde la
 * terminal (Configuración) sin internet; ambos lados se sincronizan.
 */
export function UsersTable() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [active, setActive] = useState("true");
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<StaffUserOut | "new" | null>(null);
  const [passwordFor, setPasswordFor] = useState<StaffUserOut | null>(null);

  const { data: roles } = useRoles();
  const { data: page, isLoading } = useStaffUsers({
    search: search || undefined,
    role: role === "all" ? undefined : role,
    is_active: active === "all" ? undefined : active === "true",
    limit: USERS_PAGE_SIZE,
    offset,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-64"
            placeholder="Buscar por usuario o nombre…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
          />
          <Select value={role} onValueChange={(value: string) => { setRole(value); setOffset(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roles?.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={active} onValueChange={(value: string) => { setActive(value); setOffset(0); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setEditing("new")}>Nuevo usuario</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && page?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
            {page?.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono font-medium">{user.username}</TableCell>
                <TableCell>{`${user.first_name} ${user.last_name}`.trim() || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role_name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "outline" : "secondary"}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPasswordFor(user)}>
                    Contraseña
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        offset={offset}
        pageSize={USERS_PAGE_SIZE}
        total={page?.count ?? 0}
        itemLabel="usuarios"
        onOffsetChange={setOffset}
      />

      {editing !== null && (
        <UserDialog
          user={editing === "new" ? null : editing}
          roles={roles ?? []}
          onClose={() => setEditing(null)}
        />
      )}
      {passwordFor && <PasswordDialog user={passwordFor} onClose={() => setPasswordFor(null)} />}
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function UserDialog({
  user,
  roles,
  onClose,
}: {
  user: StaffUserOut | null;
  roles: RoleOut[];
  onClose: () => void;
}) {
  const { user: me } = useAuth();
  const create = useCreateStaffUser();
  const update = useUpdateStaffUser(user?.id ?? -1);
  const selectable = roles.filter((role) => role.is_active || role.code === user?.role);

  const [form, setForm] = useState({
    username: user?.username ?? "",
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? selectable.find((role) => !role.is_superrole)?.code ?? "",
    password: "",
    is_active: user?.is_active ?? true,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { password, ...rest } = form;
    try {
      if (user) await update.mutateAsync(rest);
      else await create.mutateAsync({ ...rest, password });
      toast.success(user ? "Usuario actualizado." : "Usuario creado.");
      onClose();
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>El rol decide a qué pantallas y estaciones entra.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="first_name" label="Nombre" value={form.first_name} onChange={(v) => set("first_name", v)} />
            <TextInput id="last_name" label="Apellido" value={form.last_name} onChange={(v) => set("last_name", v)} />
          </div>
          <TextInput
            id="username"
            label="Usuario"
            value={form.username}
            onChange={(v) => set("username", v.trim())}
            hint="Con esto inicia sesión en la web, la terminal y la app."
          />
          <div className="flex flex-col gap-1.5">
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(value: string) => set("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un rol" />
              </SelectTrigger>
              <SelectContent>
                {selectable.map((role) => (
                  <SelectItem key={role.code} value={role.code}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!user && (
            <TextInput
              id="password"
              type="password"
              label="Contraseña"
              value={form.password}
              onChange={(v) => set("password", v)}
              hint="Mínimo 8 caracteres, que no sea solo números ni una contraseña común."
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="email" label="Correo (opcional)" value={form.email} onChange={(v) => set("email", v)} />
            <TextInput id="phone" label="Teléfono (opcional)" value={form.phone} onChange={(v) => set("phone", v)} />
          </div>
          {user && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.is_active}
                disabled={user.id === me?.id}
                onChange={(event) => set("is_active", event.target.checked)}
              />
              Activo (un usuario inactivo no puede iniciar sesión)
            </label>
          )}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ user, onClose }: { user: StaffUserOut; onClose: () => void }) {
  const setPassword = useSetStaffPassword(user.id);
  const [password, setValue] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    try {
      await setPassword.mutateAsync(password);
      toast.success(`Contraseña de ${user.username} actualizada.`);
      onClose();
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña de {user.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextInput id="new_password" type="password" label="Nueva contraseña" value={password} onChange={setValue} />
          <TextInput id="confirm_password" type="password" label="Repite la contraseña" value={confirm} onChange={setConfirm} />
          <DialogFooter>
            <Button type="submit" disabled={setPassword.isPending}>
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
