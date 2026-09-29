// Tipos de movimiento de hotelería, replicados desde el backend
// (hospitality/models.py LinenMovement.Kind). Hotelería es un stock rotativo:
// la planta despacha a la faena, el supervisor reparte a los campamentos y
// retira el sucio, y el administrador fija lo contado en un lugar.
export const MOVEMENT_KINDS = ["DESPACHO", "REPARTO", "RETIRO", "CONTEO"] as const;

export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  DESPACHO: "Despacho a faena",
  REPARTO: "Reparto a campamento",
  RETIRO: "Retiro de sucio",
  CONTEO: "Conteo de inventario",
};

export const MOVEMENT_KIND_TONES: Record<MovementKind, string> = {
  DESPACHO: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
  REPARTO: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  RETIRO: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  CONTEO: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
};

export function movementKindLabel(kind: string): string {
  return MOVEMENT_KIND_LABELS[kind as MovementKind] ?? kind;
}

export function movementKindTone(kind: string): string {
  return MOVEMENT_KIND_TONES[kind as MovementKind] ?? "bg-muted text-muted-foreground";
}

// Lugares del saldo (hospitality/models.py LinenLocation).
export const LOCATION_KINDS = {
  SERVILION: "SERVILION",
  FAENA: "BODEGA_FAENA",
  CAMP: "CAMPAMENTO",
} as const;
