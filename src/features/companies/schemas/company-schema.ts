import { z } from "zod";

export const BILLING_TYPES = ["PRENDAS", "KILOS"] as const;

// Modalidad de contrato (FLUJO_NEGOCIO.md §2): FLUJO_1 entrega el morral al
// trabajador en su habitación y registra esa entrega; FLUJO_2 lo entrega al
// mandante sin trazabilidad individual.
export const DELIVERY_FLOWS = ["FLUJO_1", "FLUJO_2"] as const;

// Qué lava el contrato, que es lo que decide con qué módulo se opera. PERSONAL
// es la ropa de un trabajador y va como guía (con OT, habitación y entrega
// individual); HOTELERIA es lencería a granel del campamento y va como lote en
// su propio módulo, sin persona ni destino individual.
export const SERVICE_TYPES = ["PERSONAL", "HOTELERIA"] as const;

export const SERVICE_TYPE_LABELS: Record<
  (typeof SERVICE_TYPES)[number],
  string
> = {
  PERSONAL: "Ropa de trabajador",
  HOTELERIA: "Lencería de hotelería",
};

// Qué es la empresa dentro de su cliente. MANDANTE es la empresa del propio
// cliente (se le lava directo, ej. "Panam Peñón" en el cliente "Panam Peñón");
// CONTRATISTA trabaja para ese cliente en la misma faena (Sodexo, Metso, Orica
// en Peñón). Solo cambia lo que se imprime: la etiqueta lavable y la boleta
// llevan la palabra "Contratista"; el cobro y el catálogo siguen siendo del
// cliente para ambas.
export const CLIENT_ROLES = ["MANDANTE", "CONTRATISTA"] as const;

export const CLIENT_ROLE_LABELS: Record<(typeof CLIENT_ROLES)[number], string> =
  {
    MANDANTE: "Mandante · se lava directo al cliente",
    CONTRATISTA: "Contratista",
  };

export const companySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  // Vacío (null) => el backend crea un cliente 1:1 con el mismo nombre (caso
  // "el cliente es la misma empresa").
  client_id: z.number().nullable(),
  // Solo viaja cuando client_id es null: es la faena del cliente 1:1 que el
  // backend crea junto a la empresa. Con un cliente existente, la faena ya está
  // definida en su ficha y este valor se ignora.
  faena_id: z.number().nullable(),
  client_role: z.enum(CLIENT_ROLES),
  tax_id: z.string(),
  billing_type: z.enum(BILLING_TYPES),
  service_type: z.enum(SERVICE_TYPES),
  delivery_flow: z.enum(DELIVERY_FLOWS),
  contact_name: z.string(),
  phone: z.string(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
