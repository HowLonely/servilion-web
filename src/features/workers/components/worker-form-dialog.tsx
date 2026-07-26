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
import { CompanySelect } from "@/features/companies/components/company-select";
import { useCompany } from "@/features/companies/hooks/use-companies";
import { RoomSelect } from "@/features/camps/components/room-select";
import {
  useCreateWorker,
  useUpdateWorker,
} from "@/features/workers/hooks/use-workers";
import {
  SHIFT_PATTERNS,
  workerSchema,
  type WorkerFormValues,
} from "@/features/workers/schemas/worker-schema";

import type { components } from "@/lib/api/schema";

type WorkerOut = components["schemas"]["WorkerOut"];

function defaultValuesFor(worker?: WorkerOut): WorkerFormValues {
  return {
    company_id: worker?.company_id ?? 0,
    badge_code: worker?.badge_code ?? "",
    full_name: worker?.full_name ?? "",
    national_id: worker?.national_id ?? "",
    current_room_id: worker?.current_room_id ?? null,
    shift: worker?.shift ?? "",
    position: worker?.position ?? "",
    area: worker?.area ?? "",
    phone: worker?.phone ?? "",
  };
}

export function WorkerFormDialog({
  worker,
  trigger,
}: {
  worker?: WorkerOut;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(worker);

  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker(worker?.id ?? -1);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: defaultValuesFor(worker),
  });

  // El cliente sale de la empresa elegida: acota los camps a su faena y
  // evita asignarle al trabajador una pieza de otro cliente.
  const companyId = watch("company_id");
  const { data: company } = useCompany(companyId > 0 ? companyId : undefined);

  useEffect(() => {
    if (open) reset(defaultValuesFor(worker));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: WorkerFormValues) {
    try {
      if (isEdit) {
        await updateWorker.mutateAsync(values);
      } else {
        await createWorker.mutateAsync(values);
      }
      toast.success(isEdit ? "Trabajador actualizado." : "Trabajador creado.");
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar trabajador" : "Nuevo trabajador"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Empresa</FieldLabel>
              <FieldContent>
                <CompanySelect
                  value={watch("company_id") || undefined}
                  onChange={(companyId) => setValue("company_id", companyId ?? 0)}
                />
                <FieldError errors={[errors.company_id]} />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="badge_code">Código/credencial</FieldLabel>
                <Input id="badge_code" {...register("badge_code")} />
                <FieldError errors={[errors.badge_code]} />
              </FieldContent>
              <FieldContent>
                <FieldLabel htmlFor="full_name">Nombre completo</FieldLabel>
                <Input id="full_name" {...register("full_name")} />
                <FieldError errors={[errors.full_name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="national_id">RUN</FieldLabel>
              <FieldContent>
                <Input id="national_id" {...register("national_id")} />
                <FieldError errors={[errors.national_id]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Campamento y habitación</FieldLabel>
              <FieldContent>
                <RoomSelect
                  value={watch("current_room_id")}
                  onChange={(roomId) =>
                    setValue("current_room_id", roomId)
                  }
                  clientId={company?.client_id}
                />
                <FieldError errors={[errors.current_room_id]} />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="shift">Turno</FieldLabel>
                <Select
                  value={watch("shift")}
                  onValueChange={(value: string) => setValue("shift", value)}
                >
                  <SelectTrigger id="shift">
                    <SelectValue placeholder="Selecciona un turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_PATTERNS.map((pattern) => (
                      <SelectItem key={pattern} value={pattern}>
                        {pattern}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.shift]} />
              </FieldContent>
              <FieldContent>
                <FieldLabel htmlFor="position">Cargo</FieldLabel>
                <Input id="position" {...register("position")} />
                <FieldError errors={[errors.position]} />
              </FieldContent>
            </Field>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="area">Área</FieldLabel>
                <Input id="area" {...register("area")} />
                <FieldError errors={[errors.area]} />
              </FieldContent>
              <FieldContent>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
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
