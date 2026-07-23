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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyServerErrors, parseApiError } from "@/lib/api/errors";
import { ClientSelect } from "@/features/clients/components/client-select";
import {
  useCreateCompany,
  useUpdateCompany,
} from "@/features/companies/hooks/use-companies";
import {
  companySchema,
  type CompanyFormValues,
} from "@/features/companies/schemas/company-schema";

import type { components } from "@/lib/api/schema";

type CompanyOut = components["schemas"]["CompanyOut"];

export function CompanyFormDialog({
  company,
  trigger,
}: {
  company?: CompanyOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(company);

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany(company?.id ?? -1);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      client_id: company?.client_id ?? null,
      tax_id: company?.tax_id ?? "",
      billing_type: (company?.billing_type as "PRENDAS" | "KILOS") ?? "PRENDAS",
      delivery_flow:
        (company?.delivery_flow as "FLUJO_1" | "FLUJO_2") ?? "FLUJO_1",
      reference_prefix: company?.reference_prefix ?? "",
      contact_name: company?.contact_name ?? "",
      phone: company?.phone ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? "",
        client_id: company?.client_id ?? null,
        tax_id: company?.tax_id ?? "",
        billing_type: (company?.billing_type as "PRENDAS" | "KILOS") ?? "PRENDAS",
        delivery_flow:
          (company?.delivery_flow as "FLUJO_1" | "FLUJO_2") ?? "FLUJO_1",
        reference_prefix: company?.reference_prefix ?? "",
        contact_name: company?.contact_name ?? "",
        phone: company?.phone ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: CompanyFormValues) {
    try {
      if (isEdit) {
        await updateCompany.mutateAsync(values);
      } else {
        await createCompany.mutateAsync(values);
      }
      toast.success(isEdit ? "Empresa actualizada." : "Empresa creada.");
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
          <DialogTitle>{isEdit ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
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
              <FieldLabel htmlFor="client_id">Cliente</FieldLabel>
              <FieldContent>
                <ClientSelect
                  value={watch("client_id") ?? undefined}
                  onChange={(clientId) =>
                    setValue("client_id", clientId ?? null)
                  }
                  placeholder="Crear cliente 1:1 con este nombre"
                  includeAllOption="— Crear cliente 1:1 (cliente = empresa) —"
                />
                <FieldError errors={[errors.client_id]} />
                <p className="text-xs text-muted-foreground">
                  Si dejas “cliente 1:1”, se crea un cliente con el mismo nombre y
                  esta empresa como única hija. Para agrupar varias empresas,
                  elige un cliente existente.
                </p>
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
              <FieldLabel htmlFor="billing_type">Tipo de cobro</FieldLabel>
              <FieldContent>
                <Select
                  value={watch("billing_type")}
                  onValueChange={(value: string) =>
                    setValue("billing_type", value as "PRENDAS" | "KILOS")
                  }
                >
                  <SelectTrigger id="billing_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRENDAS">Por prendas</SelectItem>
                    <SelectItem value="KILOS">Por kilos</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.billing_type]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="delivery_flow">Modalidad de entrega</FieldLabel>
              <FieldContent>
                <Select
                  value={watch("delivery_flow")}
                  onValueChange={(value: string) =>
                    setValue("delivery_flow", value as "FLUJO_1" | "FLUJO_2")
                  }
                >
                  <SelectTrigger id="delivery_flow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLUJO_1">
                      Flujo 1 - entrega en habitación
                    </SelectItem>
                    <SelectItem value="FLUJO_2">
                      Flujo 2 - entrega solo al cliente
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.delivery_flow]} />
                <p className="text-xs text-muted-foreground">
                  En Flujo 2 no se registra la entrega individual al trabajador:
                  la OT pasa de despachada directo a cobrada.
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
                  Inicial de faena o empresa que antecede al correlativo semanal
                  (ej. P1238). Si se deja vacío se usa la inicial del nombre.
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
