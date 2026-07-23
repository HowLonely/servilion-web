"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { applyServerErrors, parseApiError } from "@/lib/api/errors";
import {
  useCreateGarmentType,
  useUpdateGarmentType,
} from "@/features/garments/hooks/use-garment-types";
import {
  garmentSchema,
  type GarmentFormValues,
} from "@/features/garments/schemas/garment-schema";

import type { components } from "@/lib/api/schema";

type GarmentTypeOut = components["schemas"]["GarmentTypeOut"];

function defaultValuesFor(garment?: GarmentTypeOut): GarmentFormValues {
  return {
    code: garment?.code ?? "",
    name: garment?.name ?? "",
    is_active: garment?.is_active ?? true,
  };
}

export function GarmentFormDialog({
  garment,
  trigger,
}: {
  garment?: GarmentTypeOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(garment);

  const createGarment = useCreateGarmentType();
  const updateGarment = useUpdateGarmentType(garment?.id ?? -1);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GarmentFormValues>({
    resolver: zodResolver(garmentSchema),
    defaultValues: defaultValuesFor(garment),
  });

  useEffect(() => {
    if (open) reset(defaultValuesFor(garment));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: GarmentFormValues) {
    try {
      if (isEdit) {
        await updateGarment.mutateAsync(values);
      } else {
        await createGarment.mutateAsync(values);
      }
      toast.success(isEdit ? "Prenda actualizada." : "Prenda creada.");
      setOpen(false);
    } catch (error) {
      const apiError = parseApiError(error);
      applyServerErrors(apiError, setError);
      toast.error(apiError.detail);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar prenda" : "Nueva prenda"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Código</FieldLabel>
              <FieldContent>
                <Input id="code" {...register("code")} />
                <FieldError errors={[errors.code]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <FieldContent>
                <Input id="name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
