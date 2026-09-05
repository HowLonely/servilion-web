"use client";

import { useState } from "react";
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
import { FaenaSelect } from "@/features/camps/components/faena-select";
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

  const [faenaId, setFaenaId] = useState<number | undefined>(camp?.faena_id);
  const [campName, setCampName] = useState(camp?.name ?? "");
  const [saving, setSaving] = useState(false);

  const createCamp = useCreateCamp();
  const updateCamp = useUpdateCamp(camp?.id ?? -1);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setFaenaId(camp?.faena_id);
      setCampName(camp?.name ?? "");
    }
    setOpen(nextOpen);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!faenaId || !campName.trim()) {
      toast.error("Elige la faena y escribe el nombre del campamento.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        faena_id: faenaId,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar campamento" : "Nuevo campamento"}</DialogTitle>
          <DialogDescription>
            El campamento pertenece a la faena, no al cliente: la misma puerta
            aloja a trabajadores de distintas contratistas, se le facture a
            quien se le facture.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Faena</FieldLabel>
              <FieldContent>
                {/* Mover un campamento de faena dejaría a sus habitaciones
                    —y a los QR ya pegados en las puertas— en otro sitio. */}
                <FaenaSelect
                  value={faenaId}
                  onChange={setFaenaId}
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
