import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  tax_id: z.string(),
  // Faena donde opera el cliente (ej. el cliente "Panam Peñón" opera en la
  // faena "Peñón"). La heredan todas sus empresas —mandante y contratistas— y
  // es lo que se imprime en la etiqueta lavable y en la boleta.
  faena_id: z.number().nullable(),
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
