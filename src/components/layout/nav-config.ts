import {
  BedDouble,
  Building2,
  ClipboardList,
  Contact,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  PackageCheck,
  PackagePlus,
  Shirt,
  Tent,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

// Los cinco roles del backend (`authentication/models.py::User.Role`), no solo
// los que tienen pantalla acá. PESAJE es el caso raro: su estación es física
// —una balanza, una pantalla táctil y una etiquetera— y vive solo en
// `servilion-desktop`, así que no aparece en ningún ítem de navegación. Aun así
// tiene que estar en este tipo: sin él la app no sabía nombrar su propio rol y
// lo dejaba entrar a un Panel vacío que solo respondía 403.
export type StaffRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "PESAJE"
  | "DIGITADOR_OT"
  | "DIGITADOR_EMPAQUE";

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  PESAJE: "Pesaje",
  DIGITADOR_OT: "Digitador de OT",
  DIGITADOR_EMPAQUE: "Digitador de Empaque",
};

// --- Capacidades ---
//
// ESTAS CONSTANTES SON LA ÚNICA FUENTE DE VERDAD de los permisos en el cliente.
// Los ítems de navegación de más abajo las referencian en vez de repetir listas
// de roles a mano, y los componentes que habilitan acciones (`packing-station`,
// `packing-panel`, `order-flow-actions`) importan los helpers `canX` de aquí.
//
// Antes cada archivo llevaba su propia lista y se desincronizaron: el menú
// ofrecía "Digitalizar OT" a LAVANDERIA y "Empaque" a SUPERVISOR, y ambos
// recibían 403 al intentar la acción. Si vuelve a hacer falta una lista de
// roles, se agrega aquí y se importa; no se copia.
//
// Debe reflejar exactamente lo que exige el backend (decoradores
// `@require_roles` / `@require_admin`; ADMIN atraviesa toda restricción):
//
//   POST /api/orders/                        → DIGITADOR_OT, SUPERVISOR
//   POST /api/orders/{id}/packing/scan       → DIGITADOR_EMPAQUE, SUPERVISOR
//   POST /api/orders/{id}/packing/finish     → DIGITADOR_EMPAQUE, SUPERVISOR
//   POST /api/orders/{id}/dispatch           → DIGITADOR_EMPAQUE, SUPERVISOR
//   POST /api/orders/{id}/incomplete/resolve → DIGITADOR_EMPAQUE, SUPERVISOR
//   POST /api/orders/{id}/clean-reception    → SUPERVISOR
//   POST /api/orders/{id}/deliver            → SUPERVISOR
//   clientes · empresas · trabajadores · prendas · facturación · conflictos → ADMIN

/** Digitalizar la OT física al recibir la ropa sucia. */
export const DIGITIZE_ROLES: StaffRole[] = ["ADMIN", "SUPERVISOR", "DIGITADOR_OT"];

/** Pistolear y validar el morral limpio al empacarlo. */
export const PACKING_ROLES: StaffRole[] = [
  "ADMIN",
  "SUPERVISOR",
  "DIGITADOR_EMPAQUE",
];

/** Hitos físicos en faena: recepción del morral limpio y entrega en habitación. */
export const FIELD_FLOW_ROLES: StaffRole[] = ["ADMIN", "SUPERVISOR"];

/** Vista general de la operación: panel, listado de OT y torre de control. */
export const OPERATIONS_ROLES: StaffRole[] = ["ADMIN", "SUPERVISOR"];

/** Catálogo y dinero. Es lo único que separa a ADMIN de SUPERVISOR. */
export const ADMIN_ROLES: StaffRole[] = ["ADMIN"];

function hasRole(role: string | undefined, allowed: StaffRole[]): boolean {
  return role !== undefined && allowed.includes(role as StaffRole);
}

export const canDigitize = (role: string | undefined): boolean =>
  hasRole(role, DIGITIZE_ROLES);

export const canPack = (role: string | undefined): boolean =>
  hasRole(role, PACKING_ROLES);

export const canRunFieldFlow = (role: string | undefined): boolean =>
  hasRole(role, FIELD_FLOW_ROLES);

// --- Navegación ---

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Texto corto de apoyo para tooltips y navegación móvil. */
  description?: string;
  roles?: StaffRole[]; // si se omite, visible para todos los roles
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        href: "/",
        label: "Panel",
        icon: LayoutDashboard,
        description: "Resumen operativo del día",
        roles: OPERATIONS_ROLES,
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        href: "/orders",
        label: "Órdenes de trabajo",
        icon: ClipboardList,
        description: "Órdenes de lavado y su estado",
        roles: OPERATIONS_ROLES,
      },
      {
        href: "/orders/new",
        label: "Digitalizar OT",
        icon: FilePlus2,
        description: "Digitalizar la OT al recibir ropa sucia en Antofagasta",
        roles: DIGITIZE_ROLES,
      },
      {
        href: "/packing",
        label: "Empaque y revisión",
        icon: PackageCheck,
        description: "Pistolear cada prenda del morral limpio y validar completitud",
        roles: PACKING_ROLES,
      },
    ],
  },
  {
    // Grupo aparte y no un ítem más de "Operación": hotelería es otro servicio,
    // no otra pantalla del mismo. Lo que entra es lencería a granel del
    // campamento —sin trabajador, sin habitación y sin entrega individual—, así
    // que separarlo en el menú evita que alguien busque un morral aquí o
    // registre sábanas como si fueran la ropa de una persona.
    label: "Hotelería",
    items: [
      {
        href: "/hospitality",
        label: "Lotes de lencería",
        icon: BedDouble,
        description: "Cargas de lencería del campamento y su merma",
        roles: OPERATIONS_ROLES,
      },
      {
        href: "/hospitality/new",
        label: "Recibir carga",
        icon: PackagePlus,
        description: "Registrar la llegada de lencería sucia del campamento",
        roles: DIGITIZE_ROLES,
      },
    ],
  },
  {
    label: "Reportería",
    items: [
      {
        href: "/reports/operations",
        label: "Torre de control",
        icon: GaugeCircle,
        description: "Estado operativo en tiempo real y cuellos de botella",
        roles: OPERATIONS_ROLES,
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        href: "/clients",
        label: "Clientes",
        icon: Contact,
        description: "Clientes y su catálogo de precios (agrupan empresas)",
        roles: ADMIN_ROLES,
      },
      {
        href: "/companies",
        label: "Empresas",
        icon: Building2,
        description: "Empresas de cada cliente",
        roles: ADMIN_ROLES,
      },
      {
        href: "/camps",
        label: "Campamentos",
        icon: Tent,
        description: "Alojamiento de la faena y códigos QR de las puertas",
        roles: ADMIN_ROLES,
      },
      {
        href: "/workers",
        label: "Trabajadores",
        icon: Users,
        description: "Personal en faena",
        roles: ADMIN_ROLES,
      },
      {
        href: "/garments",
        label: "Prendas",
        icon: Shirt,
        description: "Catálogo de tipos de prenda (el precio se define por cliente)",
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/sync-conflicts",
        label: "Conflictos de sincronización",
        icon: TriangleAlert,
        description: "Divergencias entre la app en terreno y el servidor",
        roles: ADMIN_ROLES,
      },
    ],
  },
];

/** Lista plana de todos los ítems, útil para resolver el título de la ruta actual. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function isNavItemVisible(item: NavItem, role: string | undefined): boolean {
  if (!item.roles) return true;
  return role !== undefined && item.roles.includes(role as StaffRole);
}

/** Devuelve el ítem de navegación que corresponde a la ruta dada (match por prefijo). */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  const matches = NAV_ITEMS.filter((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  // El match más específico (href más largo) gana.
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * ¿Este rol tiene alguna pantalla en el panel web?
 *
 * Hoy solo `PESAJE` responde que no: su puesto es la báscula de Antofagasta y
 * se opera en la terminal de escritorio. Se pregunta a la navegación en vez de
 * comparar contra una lista de roles para que agregar un ítem visible para él
 * baste para que la respuesta cambie sola.
 */
export function hasWorkspace(role: string | undefined): boolean {
  return NAV_ITEMS.some((item) => isNavItemVisible(item, role));
}

/**
 * Primera pantalla a la que mandar al usuario tras iniciar sesión.
 *
 * Los digitadores no ven el Panel, así que enviarlos a "/" los dejaría en una
 * página vacía: se les manda directo a su estación. Se resuelve desde la propia
 * navegación para que un cambio de permisos arrastre también el destino.
 *
 * Para un rol sin pantallas devuelve "/", que es donde `DashboardHomeGuard`
 * explica que su puesto está en la terminal de escritorio.
 */
export function landingPathForRole(role: string | undefined): string {
  const firstVisible = NAV_ITEMS.find((item) => isNavItemVisible(item, role));
  return firstVisible?.href ?? "/";
}
