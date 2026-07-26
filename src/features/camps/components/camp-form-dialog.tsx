"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { parseApiError } from "@/lib/api/errors";
import { ClientSelect } from "@/features/clients/components/client-select";
import {
  useCreateCamp,
  useUpdateCamp,
} from "@/features/camps/hooks/use-camps";

import type { components } from "@/lib/api/schema";

type CampOut = components["schemas"]["CampOut"];

export function CampFormDialog({
  camp,
  trigger,
}: {
  camp?: CampOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(camp);

  const [clientId, setClientId] = useState<number | undefined>(camp?.client_id);
  const [campName, setCampName] = useState(camp?.name ?? "");
  const [saving, setSaving] = useState(false);

  const createCamp = useCreateCamp();
  const updateCamp = useUpdateCamp(camp?.id ?? -1);

  useEffect(() => {
    if (!open) return;
    setClientId(camp?.client_id);
    setCampName(camp?.name ?? "");
  }, [open, camp]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!clientId || !campName.trim()) {
      toast.error("Elige un cliente y escribe el nombre del campamento.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        client_id: clientId,
        name: campName.trim(),
        is_active: camp?.is_active ?? true,
      };
      if (isEdit) {
        await updateCamp.mutateAsync(body);
      } else {
        await createCamp.mutateAsync(body);
      }
      toast.success(isEdit ? "Campamento actualizado." : "Campamento creado.");
      setOpen(false);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar campamento" : "Nuevo campamento"}</DialogTitle>
          <DialogDescription>
            El camp pertenece a un cliente, no a una empresa: varias
            contratistas del mismo cliente alojan a su gente en el mismo lugar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Cliente</FieldLabel>
              <FieldContent>
                {/* Mover un camp de cliente dejaría a sus rooms
                    (y a los QR ya pegados) colgando de otra faena. */}
                <ClientSelect
                  value={clientId}
                  onChange={setClientId}
                  disabled={isEdit}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="camp-name">Nombre</FieldLabel>
              <FieldContent>
                <Input
                  id="camp-name"
                  autoFocus
                  placeholder="Ej. BONANZA"
                  value={campName}
                  onChange={(event) => setCampName(event.target.value.toUpperCase())}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear campamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
