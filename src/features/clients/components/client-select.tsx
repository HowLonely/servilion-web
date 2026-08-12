"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CLIENTS_SELECT_LIMIT,
  useClient,
  useClients,
} from "@/features/clients/hooks/use-clients";

const SEARCH_DEBOUNCE_MS = 300;

export function ClientSelect({
  value,
  onChange,
  placeholder = "Selecciona un cliente",
  includeAllOption,
  disabled,
}: {
  value: number | undefined;
  onChange: (clientId: number | undefined) => void;
  placeholder?: string;
  includeAllOption?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: page, isLoading } = useClients({
    search: debouncedSearch || undefined,
    is_active: true,
    limit: CLIENTS_SELECT_LIMIT,
  });
  const clients = page?.items;

  // El cliente ya elegido puede no estar en la página de resultados actual
  // (ej. si se cambió la búsqueda después de seleccionar), así que se
  // resuelve aparte para mostrar su nombre en el botón.
  const { data: selectedClient } = useClient(value);
  const selected = clients?.find((c) => c.id === value) ?? selectedClient;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.name : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!isLoading && !clients?.length && (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}
            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value === undefined ? "opacity-100" : "opacity-0")}
                  />
                  {includeAllOption}
                </CommandItem>
              )}
              {clients?.map((client) => (
                <CommandItem
                  key={client.id}
                  value={String(client.id)}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", client.id === value ? "opacity-100" : "opacity-0")}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
