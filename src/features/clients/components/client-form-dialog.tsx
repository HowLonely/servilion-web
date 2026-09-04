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
import { FaenaSelect } from "@/features/camps/components/faena-select";
import {
  useCreateClient,
  useUpdateClient,
} from "@/features/clients/hooks/use-clients";
import {
  clientSchema,
  type ClientFormValues,
} from "@/features/clients/schemas/client-schema";

import type { components } from "@/lib/api/schema";

type ClientOut = components["schemas"]["ClientOut"];

function defaultValuesFor(client?: ClientOut): ClientFormValues {
  return {
    name: client?.name ?? "",
    tax_id: client?.tax_id ?? "",
    faena_id: client?.faena_id ?? null,
    reference_prefix: client?.reference_prefix ?? "",
    contact_name: client?.contact_name ?? "",
    phone: client?.phone ?? "",
  };
}

export function ClientFormDialog({
  client,
  trigger,
}: {
  client?: ClientOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(client);

  const createClient = useCreateClient();
  const updateClient = useUpdateClient(client?.id ?? -1);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValuesFor(client),
  });

  useEffect(() => {
    if (open) reset(defaultValuesFor(client));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: ClientFormValues) {
    try {
      if (isEdit) {
        await updateClient.mutateAsync(values);
      } else {
        await createClient.mutateAsync(values);
      }
      toast.success(isEdit ? "Cliente actualizado." : "Cliente creado.");
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
          <DialogTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <FieldContent>
                <Input id="name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tax_id">RUT</FieldLabel>
              <FieldContent>
                <Input id="tax_id" {...register("tax_id")} />
                <FieldError errors={[errors.tax_id]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="faena_id">Faena</FieldLabel>
              <FieldContent>
                <FaenaSelect
                  value={watch("faena_id") ?? undefined}
                  onChange={(faenaId) => setValue("faena_id", faenaId ?? null)}
                />
                <FieldError errors={[errors.faena_id]} />
                <p className="text-xs text-muted-foreground">
                  Dónde opera este cliente. La heredan todas sus empresas y es lo
                  que se imprime en la etiqueta lavable y en la boleta. Si se deja
                  vacía, se usa la faena del campamento al que va el morral.
                </p>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="reference_prefix">Prefijo del ref</FieldLabel>
              <FieldContent>
                <Input
                  id="reference_prefix"
                  maxLength={3}
                  placeholder="P"
                  {...register("reference_prefix")}
                />
                <FieldError errors={[errors.reference_prefix]} />
                <p className="text-xs text-muted-foreground">
                  Antecede al correlativo que se imprime en la etiqueta lavable
                  (la “P” de P1375A). Si se deja vacío se usa la inicial del
                  nombre.
                </p>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="contact_name">Contacto</FieldLabel>
              <FieldContent>
                <Input id="contact_name" {...register("contact_name")} />
                <FieldError errors={[errors.contact_name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <FieldContent>
                <Input id="phone" {...register("phone")} />
                <FieldError errors={[errors.phone]} />
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
