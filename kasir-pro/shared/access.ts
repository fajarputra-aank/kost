export type AccessRole = "ADMIN" | "KASIR";
export type PageAccess = "allow" | "admin-only";
export type AccessCapability = "checkout" | "view_catalog" | "manage_catalog" | "manage_members" | "manage_promos" | "manage_settings" | "manage_users" | "view_audit" | "manage_finance" | "backup_restore" | "delete_data";

const ROLE_CAPABILITIES: Record<AccessRole, readonly AccessCapability[]> = {
  ADMIN: ["checkout", "view_catalog", "manage_catalog", "manage_members", "manage_promos", "manage_settings", "manage_users", "view_audit", "manage_finance", "backup_restore", "delete_data"],
  KASIR: ["checkout", "view_catalog"],
};

export const ADMIN_ONLY_PAGES = ["settings", "users", "backup", "audit", "payables", "purchases", "expenses", "promos"] as const;

export function getPageAccess(role: AccessRole, page: string): PageAccess {
  return role === "ADMIN" || !ADMIN_ONLY_PAGES.includes(page as (typeof ADMIN_ONLY_PAGES)[number]) ? "allow" : "admin-only";
}

export function canAccessAdminPage(role: AccessRole, page: string) {
  return getPageAccess(role, page) === "allow";
}

export function canDeleteData(role: AccessRole) {
  return canPerform(role, "delete_data");
}

export function canPerform(role: AccessRole, capability: AccessCapability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function getRoleLabel(role: AccessRole) {
  return role === "ADMIN" ? "Administrator" : "Kasir";
}
