export type AccessRole = "ADMIN" | "KASIR";
export type PageAccess = "allow" | "admin-only";

export const ADMIN_ONLY_PAGES = ["settings", "users", "backup", "audit", "payables", "purchases", "expenses", "promos"] as const;

export function getPageAccess(role: AccessRole, page: string): PageAccess {
  return role === "ADMIN" || !ADMIN_ONLY_PAGES.includes(page as (typeof ADMIN_ONLY_PAGES)[number]) ? "allow" : "admin-only";
}

export function canAccessAdminPage(role: AccessRole, page: string) {
  return getPageAccess(role, page) === "allow";
}

export function canDeleteData(role: AccessRole) {
  return role === "ADMIN";
}
