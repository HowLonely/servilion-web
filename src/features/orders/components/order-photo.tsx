"use client";

import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { parseApiError } from "@/lib/api/errors";
import { useUploadOrderPhoto } from "@/features/orders/hooks/use-order-photo";

export function OrderPhoto({
  orderId,
  photoUrl,
}: {
  orderId: number;
  photoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadOrderPhoto(orderId);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadPhoto.mutateAsync(file);
      toast.success("Evidencia subida.");
    } catch (error) {
      toast.error(parseApiError(error).detail);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Evidencia de la OT"
          className="max-h-64 rounded-md border object-contain"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded-md border text-sm text-muted-foreground">
          Sin evidencia fotográfica
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
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploadPhoto.isPending}
      >
        {uploadPhoto.isPending ? "Subiendo..." : photoUrl ? "Reemplazar foto" : "Subir foto"}
      </Button>
    </div>
  );
}
