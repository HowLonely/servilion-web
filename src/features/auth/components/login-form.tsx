"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useAuth } from "@/lib/auth/auth-provider";
import { landingPathForRole } from "@/components/layout/nav-config";
import { parseApiError } from "@/lib/api/errors";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login-schema";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await login(values.username, values.password);
      // Sin `next` se rutea por rol: un digitador no ve el Panel, así que
      // mandarlo a "/" lo dejaría en una página vacía.
      router.push(searchParams.get("next") ?? landingPathForRole(user.role));
    } catch (error) {
      toast.error(parseApiError(error).detail);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Usuario</FieldLabel>
          <FieldContent>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              {...register("username")}
            />
            <FieldError errors={[errors.username]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </FieldContent>
        </Field>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
