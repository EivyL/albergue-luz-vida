export const ROLES = {
  ADMIN: "ADMIN",
  COORD: "COORD",
  TSOCIAL: "TSOCIAL",
  INV: "INV",
  COMPRAS: "COMPRAS",
  PROD: "PROD",
  LECTOR: "LECTOR",
};

export const MENU = [
  { path: "/",                label: "Inicio",         roles: Object.values(ROLES) },
  { path: "/admin/usuarios",  label: "Usuarios",       roles: [ROLES.ADMIN] },
  { path: "/beneficiarios",   label: "Beneficiarios",  roles: [ROLES.ADMIN, ROLES.COORD, ROLES.TSOCIAL] },
  { path: "/inventario",      label: "Inventario",     roles: [ROLES.ADMIN, ROLES.INV] },
  { path: "/compras",         label: "Compras",        roles: [ROLES.ADMIN, ROLES.COMPRAS] },
  { path: "/produccion",      label: "Producción",     roles: [ROLES.ADMIN, ROLES.PROD] },
];

export const can = (user, roles = []) => roles.length === 0 || roles.includes(user?.rol);
