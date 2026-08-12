import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  tax_id: z.string(),
  // Inicial que antecede al correlativo del ref (la "P" de P1375A). Es del
  // cliente porque el ref identifica a quién se le factura la guía.
  reference_prefix: z
    .string()
    .max(3, "Máximo 3 caracteres.")
    .regex(/^[A-Za-z]*$/, "Solo letras."),
  contact_name: z.string(),
  phone: z.string(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
