import {
  ArrowLeftRight,
  BedDouble,
  ClipboardCheck,
  Building2,
  ClipboardList,
  Contact,
  GaugeCircle,
  KeyRound,
  LayoutDashboard,
  Settings,
  Shirt,
  Tent,
  TriangleAlert,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { components } from "@/lib/api/schema";

type UserOut = components["schemas"]["UserOut"];

// --- Permisos ---
//
// ESTAS CONSTANTES SON LA ÚNICA FUENTE DE VERDAD de los permisos en el cliente.
// Los roles ya no son fijos: cada rol es una lista de permisos que se edita en
// Configuración → Roles, y `/api/auth/me` devuelve los del usuario
// (`user.permissions`). Los códigos son los de
// `servilion-backend/authentication/permissions.py::Perm`; la terminal de
// escritorio usa los mismos.
//
// Ocultar un ítem no es la defensa: el backend exige el mismo permiso en el
// endpoint. Esto solo evita ofrecer una pantalla que va a responder 403.
//
// Pesaje, digitalización, empaque y despachos no tienen pantalla aquí: se
// hacen en la terminal de planta contra el servidor local, y la nube los
// rechaza (409) para que no haya dos lugares emitiendo refs o cerrando el
// mismo morral.
export const PERM = {
  fieldOrders: "field.orders",
  reports: "reports.view",
  linenView: "hospitality.view",
  linenManage: "hospitality.manage",
  catalog: "catalog.manage",
  workers: "workers.manage",
  settings: "settings.manage",
  users: "users.manage",
  sync: "sync.manage",
} as const;

type MaybeUser = Pick<UserOut, "permissions"> | null | undefined;

export function hasPermission(user: MaybeUser, permission: string): boolean {
  return user?.permissions?.includes(permission) ?? false;
}

/** Hitos físicos en faena: recepción del morral limpio y entrega en habitación. */
export const canRunFieldFlow = (user: MaybeUser): boolean => hasPermission(user, PERM.fieldOrders);

/** Conteo de inventario y anulación de movimientos de lencería. */
export const canManageLinenStock = (user: MaybeUser): boolean => hasPermission(user, PERM.linenManage);

/** Nombre visible del rol del usuario. */
export function roleLabel(user: Pick<UserOut, "role" | "role_name"> | null | undefined): string {
  return user?.role_name || user?.role || "";
}

// --- Navegación ---

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Texto corto de apoyo para tooltips y navegación móvil. */
  description?: string;
  /** Visible con cualquiera de estos permisos. Si se omite, visible para todos. */
  permissions?: string[];
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
        permissions: [PERM.reports],
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
        permissions: [PERM.reports],
      },
    ],
  },
  {
    // Grupo aparte y no un ítem más de "Operación": hotelería es otro servicio,
    // no otra pantalla del mismo. La lencería es un stock rotativo del cliente
    // —sin trabajador, sin habitación y sin entrega individual— que se controla
    // por campamento. El despacho se registra en la terminal de la planta y el
    // reparto y retiro en la app móvil; aquí se consulta y se corrige.
    label: "Hotelería",
    items: [
      {
        href: "/hospitality",
        label: "Saldos de lencería",
        icon: BedDouble,
        description: "Lencería de cada cliente por campamento, bodega de faena y Servilion",
        permissions: [PERM.reports, PERM.linenView],
      },
      {
        href: "/hospitality/movements",
        label: "Movimientos",
        icon: ArrowLeftRight,
        description: "Despachos, repartos, retiros y conteos de lencería",
        permissions: [PERM.reports, PERM.linenView],
      },
      {
        href: "/hospitality/count",
        label: "Conteo de inventario",
        icon: ClipboardCheck,
        description: "Carga inicial y reajustes del saldo de lencería",
        permissions: [PERM.linenManage],
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
        permissions: [PERM.reports],
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
        permissions: [PERM.catalog],
      },
      {
        href: "/companies",
        label: "Empresas",
        icon: Building2,
        description: "Empresas de cada cliente",
        permissions: [PERM.catalog],
      },
      {
        href: "/camps",
        label: "Campamentos",
        icon: Tent,
        description: "Alojamiento de la faena y códigos QR de las puertas",
        permissions: [PERM.catalog],
      },
      {
        href: "/workers",
        label: "Trabajadores",
        icon: Users,
        description: "Personal en faena",
        permissions: [PERM.workers],
      },
      {
        href: "/garments",
        label: "Prendas",
        icon: Shirt,
        description: "Catálogo de tipos de prenda (el precio se define por cliente)",
        permissions: [PERM.catalog],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/users",
        label: "Usuarios",
        icon: UserCog,
        description: "Cuentas del staff y su rol",
        permissions: [PERM.users],
      },
      {
        href: "/roles",
        label: "Roles y permisos",
        icon: KeyRound,
        description: "Qué puede hacer cada rol en la web, la terminal y la app",
        permissions: [PERM.users],
      },
      {
        href: "/sync-conflicts",
        label: "Sincronización",
        icon: TriangleAlert,
        description: "Servidor local de planta, conflictos de la app en terreno e incidencias",
        permissions: [PERM.sync],
      },
      {
        href: "/settings",
        label: "Configuración",
        icon: Settings,
        description: "Parámetros operativos, como el cupo mensual de cargos express",
        permissions: [PERM.settings],
      },
    ],
  },
];

/** Lista plana de todos los ítems, útil para resolver el título de la ruta actual. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function isNavItemVisible(item: NavItem, user: MaybeUser): boolean {
  if (!item.permissions) return true;
  return item.permissions.some((permission) => hasPermission(user, permission));
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
 * ¿Este usuario tiene alguna pantalla en el panel web?
 *
 * No, por ejemplo, quien solo pesa: su puesto es la báscula de Antofagasta y
 * se opera en la terminal de escritorio. Se pregunta a la navegación en vez de
 * comparar contra una lista de roles, así un cambio de permisos del rol cambia
 * la respuesta solo.
 */
export function hasWorkspace(user: MaybeUser): boolean {
  return NAV_ITEMS.some((item) => isNavItemVisible(item, user));
}

/**
 * Primera pantalla a la que mandar al usuario tras iniciar sesión. Para quien
 * no tiene pantallas devuelve "/", donde `DashboardHomeGuard` explica que su
 * puesto está en la terminal de escritorio.
 */
export function landingPathFor(user: MaybeUser): string {
  const firstVisible = NAV_ITEMS.find((item) => isNavItemVisible(item, user));
  return firstVisible?.href ?? "/";
}
