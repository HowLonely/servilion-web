"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPS_SELECT_LIMIT,
  useCamps,
} from "@/features/camps/hooks/use-camps";

const ALL_VALUE = "__all__";

export function CampSelect({
  value,
  onChange,
  faenaId,
  placeholder = "Selecciona un campamento",
  includeAllOption,
  className,
}: {
  value: number | undefined;
  onChange: (campId: number | undefined) => void;
  /** Acota la lista a los campamentos de un cliente. */
  faenaId?: number;
  placeholder?: string;
  includeAllOption?: string;
  className?: string;
}) {
  const { data: page, isLoading } = useCamps({
    faena_id: faenaId,
    is_active: true,
    limit: CAMPS_SELECT_LIMIT,
  });
  const camps = page?.items;

  return (
    <Select
      value={value !== undefined ? String(value) : ""}
      onValueChange={(next: string) =>
        onChange(next === ALL_VALUE ? undefined : Number(next))
      }
      disabled={isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value={ALL_VALUE}>{includeAllOption}</SelectItem>}
        {camps?.map((camp) => (
          <SelectItem key={camp.id} value={String(camp.id)}>
            {camp.name}
            <span className="text-muted-foreground"> · {camp.faena_name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
