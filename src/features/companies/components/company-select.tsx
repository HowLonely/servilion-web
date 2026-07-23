"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPANIES_SELECT_LIMIT,
  useCompanies,
} from "@/features/companies/hooks/use-companies";

export function CompanySelect({
  value,
  onChange,
  placeholder = "Selecciona una empresa",
  includeAllOption,
}: {
  value: number | undefined;
  onChange: (companyId: number | undefined) => void;
  placeholder?: string;
  includeAllOption?: string;
}) {
  const { data: page, isLoading } = useCompanies({
    is_active: true,
    limit: COMPANIES_SELECT_LIMIT,
  });
  const companies = page?.items;

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
        {companies?.map((company) => (
          <SelectItem key={company.id} value={String(company.id)}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
