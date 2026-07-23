import { z } from "zod";

// Patrones de turno observados en la operación real (ver FLUJO_NEGOCIO.md sección 1).
export const SHIFT_PATTERNS = [
  "4X3",
  "4X4",
  "5X2",
  "7X7",
  "10X10",
  "14X14",
  "15X15",
] as const;

export const workerSchema = z.object({
  company_id: z.number().min(1, "Selecciona una empresa."),
  badge_code: z.string().min(1, "El código/credencial es obligatorio."),
  full_name: z.string().min(1, "El nombre es obligatorio."),
  national_id: z.string(),
  camp: z.string(),
  room: z.string(),
  shift: z.string(),
  position: z.string(),
  area: z.string(),
  phone: z.string(),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;
