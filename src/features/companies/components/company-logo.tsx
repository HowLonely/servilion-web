"use client";

import { cn } from "@/lib/utils";

/**
 * Logo de la empresa cliente, para identificarla de un vistazo.
 *
 * Cuando no hay logo cargado cae a las iniciales del nombre en vez de dejar un
 * hueco: en la mesa de empaque conviven morrales de varias empresas y el bloque
 * tiene que ocupar siempre el mismo espacio para que la fila no se descuadre al
 * pasar de una guía con logo a otra sin él.
 */
export function CompanyLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white",
        className,
      )}
      title={name}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo remoto (S3) de tamaño y proporción variables; Next/Image exigiría configurar cada host y no aporta aquí.
        <img
          src={logoUrl}
          alt={name}
          className="size-full object-contain p-1"
        />
      ) : (
        <span className="text-xs font-bold text-neutral-500">
          {initials || "—"}
        </span>
      )}
    </span>
  );
}
