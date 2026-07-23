import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";

import { companiesKeys } from "./use-companies";

import type { components } from "@/lib/api/schema";

type CompanyOut = components["schemas"]["CompanyOut"];

// Flujo de dos pasos: 1) pedir URL presignada y subir directo a S3,
// 2) confirmar la subida contra el backend. El backend nunca recibe el archivo.
export function useUploadCompanyLogo(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<CompanyOut> => {
      const { data: uploadData, error: uploadError } = await api.POST(
        "/api/companies/{company_id}/logo-upload-url",
        {
          params: { path: { company_id: companyId } },
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
        throw { detail: "No se pudo subir el logo a almacenamiento." };
      }

      const { data: confirmData, error: confirmError } = await api.POST(
        "/api/companies/{company_id}/logo-confirm",
        {
          params: { path: { company_id: companyId } },
          body: { object_key: uploadData.object_key },
        },
      );
      if (confirmError) throw parseApiError(confirmError);
      return confirmData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
}
