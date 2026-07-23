"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLIENTS_SELECT_LIMIT,
  useClients,
} from "@/features/clients/hooks/use-clients";

export function ClientSelect({
  value,
  onChange,
  placeholder = "Selecciona un cliente",
  includeAllOption,
}: {
  value: number | undefined;
  onChange: (clientId: number | undefined) => void;
  placeholder?: string;
  includeAllOption?: string;
}) {
  const { data: page, isLoading } = useClients({
    is_active: true,
    limit: CLIENTS_SELECT_LIMIT,
  });
  const clients = page?.items;

  return (
    <Select
      value={value !== undefined ? String(value) : ""}
      onValueChange={(next: string) =>
        onChange(next === "__all__" ? undefined : Number(next))
      }
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="__all__">{includeAllOption}</SelectItem>
        )}
        {clients?.map((client) => (
          <SelectItem key={client.id} value={String(client.id)}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
