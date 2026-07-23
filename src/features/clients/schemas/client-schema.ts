import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  tax_id: z.string(),
  contact_name: z.string(),
  phone: z.string(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
