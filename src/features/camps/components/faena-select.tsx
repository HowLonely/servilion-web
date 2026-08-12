"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFaenas } from "@/features/camps/hooks/use-camps";

/**
 * Selector de faena: el sitio físico dueño del campamento.
 *
 * Son muy pocas —hoy solo Peñón— y crear una es excepcional, así que el
 * selector solo elige entre las existentes: no ofrece crear una al vuelo. Esa
 * fricción es deliberada, porque una faena de más vuelve a duplicar los
 * campamentos físicos y sus QR de puerta.
 */
export function FaenaSelect({
  value,
  onChange,
  disabled,
  placeholder = "Elige la faena",
}: {
  value: number | undefined;
  onChange: (faenaId: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { data: page, isLoading } = useFaenas();
  const faenas = page?.items ?? [];

  return (
    <Select
      value={value !== undefined ? String(value) : undefined}
      onValueChange={(next: string) => onChange(next ? Number(next) : undefined)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Cargando…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {faenas.map((faena) => (
          <SelectItem key={faena.id} value={String(faena.id)}>
            {faena.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
