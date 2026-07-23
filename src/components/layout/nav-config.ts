import {
  Building2,
  ClipboardList,
  Contact,
  FilePlus2,
  GaugeCircle,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Shirt,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export type StaffRole =
  | "ADMIN"
  | "RECEPCION"
  | "LAVANDERIA"
  | "DESPACHO"
  | "SUPERVISOR";

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  RECEPCION: "Recepción",
  LAVANDERIA: "Lavandería",
  DESPACHO: "Despacho",
  SUPERVISOR: "Supervisor",
};

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
      },
      {
        href: "/orders/new",
        label: "Digitalizar OT",
        icon: FilePlus2,
        description: "Digitalizar la OT al recibir ropa sucia en Antofagasta",
        roles: ["ADMIN", "SUPERVISOR", "RECEPCION", "LAVANDERIA"],
      },
      {
        href: "/packing",
        label: "Empaque y revisión",
        icon: PackageCheck,
        description: "Pistolear cada prenda del morral limpio y validar completitud",
        roles: ["ADMIN", "SUPERVISOR", "LAVANDERIA", "DESPACHO"],
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
        roles: ["ADMIN", "SUPERVISOR"],
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
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        href: "/companies",
        label: "Empresas",
        icon: Building2,
        description: "Empresas de cada cliente",
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        href: "/workers",
        label: "Trabajadores",
        icon: Users,
        description: "Personal en faena",
        roles: ["ADMIN", "SUPERVISOR", "RECEPCION"],
      },
      {
        href: "/garments",
        label: "Prendas",
        icon: Shirt,
        description: "Catálogo de tipos de prenda (el precio se define por cliente)",
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        href: "/reports/billing",
        label: "Facturación",
        icon: Receipt,
        description: "Reportes de cobro por cliente o empresa",
        roles: ["ADMIN", "SUPERVISOR"],
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
        roles: ["ADMIN", "SUPERVISOR"],
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
