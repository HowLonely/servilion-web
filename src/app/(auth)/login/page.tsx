import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "@/components/layout/brand-mark";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40 p-4">
      {/* Halo de marca de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-144 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa con tu cuenta de staff para acceder al panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Servilion · Sistema de gestión de lavandería industrial
        </p>
      </div>
    </div>
  );
}
