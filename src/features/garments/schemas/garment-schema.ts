import { z } from "zod";

export const garmentSchema = z.object({
  code: z.string().min(1, "El código es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  is_active: z.boolean(),
});

export type GarmentFormValues = z.infer<typeof garmentSchema>;
