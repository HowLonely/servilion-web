import { WashingMachine } from "lucide-react";

import { cn } from "@/lib/utils";

/** Isotipo + logotipo de Servilion. Úsalo en el sidebar, el header móvil y el login. */
export function BrandMark({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <WashingMachine className="size-5" />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-base font-semibold tracking-tight">
            Servilion
          </span>
          <span className="text-[0.7rem] font-medium text-muted-foreground">
            Lavandería industrial
          </span>
        </span>
      )}
    </div>
  );
}
