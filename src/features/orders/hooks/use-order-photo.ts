import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import { ordersKeys } from "./use-orders";

import type { components } from "@/lib/api/schema";

type LaundryOrderOut = components["schemas"]["LaundryOrderOut"];

export function useUploadOrderPhoto(orderId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<LaundryOrderOut> => {
      const { data: uploadData, error: uploadError } = await api.POST(
        "/api/orders/{order_id}/photo-upload-url",
        {
          params: { path: { order_id: orderId } },
          body: { filename: file.name, content_type: file.type },
        },
      );
      if (uploadError) throw parseApiError(uploadError);

      const formData = new FormData();
      for (const [key, value] of Object.entries(uploadData.fields)) {
        formData.append(key, value);
      }
      formData.append("file", file);

      const s3Res = await fetch(uploadData.upload_url, {
        method: "POST",
        body: formData,
      });
      if (!s3Res.ok) {
        throw { detail: "No se pudo subir la evidencia a almacenamiento." };
      }

      const { data: confirmData, error: confirmError } = await api.POST(
        "/api/orders/{order_id}/photo-confirm",
        {
          params: { path: { order_id: orderId } },
          body: { object_key: uploadData.object_key },
        },
      );
      if (confirmError) throw parseApiError(confirmError);
      return confirmData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
    },
  });
}
