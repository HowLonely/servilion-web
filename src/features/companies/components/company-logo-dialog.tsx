"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseApiError } from "@/lib/api/errors";
import { useUploadCompanyLogo } from "@/features/companies/hooks/use-company-logo";

export function CompanyLogoDialog({
  companyId,
  logoUrl,
  trigger,
}: {
  companyId: number;
  logoUrl: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadLogo = useUploadCompanyLogo(companyId);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo actualizado.");
      setOpen(false);
    } catch (error) {
      toast.error(parseApiError(error).detail);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logo de la empresa</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo actual"
              className="h-24 w-24 rounded-md border object-contain"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border text-xs text-muted-foreground">
              Sin logo
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploadLogo.isPending}
          >
            {uploadLogo.isPending ? "Subiendo..." : "Subir nuevo logo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
