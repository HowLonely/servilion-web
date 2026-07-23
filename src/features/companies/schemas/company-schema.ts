import { z } from "zod";

export const BILLING_TYPES = ["PRENDAS", "KILOS"] as const;

// Modalidad de contrato (FLUJO_NEGOCIO.md §2): FLUJO_1 entrega el morral al
// trabajador en su habitación y registra esa entrega; FLUJO_2 lo entrega al
// mandante sin trazabilidad individual.
export const DELIVERY_FLOWS = ["FLUJO_1", "FLUJO_2"] as const;

export const companySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  // Vacío (null) => el backend crea un cliente 1:1 con el mismo nombre (caso
  // "el cliente es la misma empresa").
  client_id: z.number().nullable(),
  tax_id: z.string(),
  billing_type: z.enum(BILLING_TYPES),
  delivery_flow: z.enum(DELIVERY_FLOWS),
  // Inicial de faena/empresa que antecede al correlativo semanal del ref
  // (la "P" de P1238).
  reference_prefix: z
    .string()
    .max(3, "Máximo 3 caracteres.")
    .regex(/^[A-Za-z]*$/, "Solo letras."),
  contact_name: z.string(),
  phone: z.string(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
