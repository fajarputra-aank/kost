import { describe, expect, it } from "vitest";
import { canAccessAdminPage, canDeleteData, canPerform, getPageAccess, getRoleLabel } from "./access";

describe("Admin access policy", () => {
  it("allows Admin to open settings and delete data", () => {
    expect(getPageAccess("ADMIN", "settings")).toBe("allow");
    expect(canAccessAdminPage("ADMIN", "settings")).toBe(true);
    expect(canDeleteData("ADMIN")).toBe(true);
  });

  it("blocks Kasir from settings and every destructive data action", () => {
    expect(getPageAccess("KASIR", "settings")).toBe("admin-only");
    expect(canAccessAdminPage("KASIR", "settings")).toBe(false);
    expect(canAccessAdminPage("KASIR", "promos")).toBe(false);
    expect(canDeleteData("KASIR")).toBe(false);
  });

  it("keeps permitted operational pages available to Kasir", () => {
    expect(getPageAccess("KASIR", "pos")).toBe("allow");
    expect(canAccessAdminPage("KASIR", "pos")).toBe(true);
    expect(canAccessAdminPage("KASIR", "products")).toBe(true);
    expect(canAccessAdminPage("KASIR", "transactions")).toBe(true);
  });

  it("limits Kasir to checkout and catalog viewing while Admin manages the workspace", () => {
    expect(canPerform("KASIR", "checkout")).toBe(true);
    expect(canPerform("KASIR", "view_catalog")).toBe(true);
    expect(canPerform("KASIR", "manage_catalog")).toBe(false);
    expect(canPerform("KASIR", "manage_users")).toBe(false);
    expect(canPerform("ADMIN", "manage_catalog")).toBe(true);
    expect(canPerform("ADMIN", "backup_restore")).toBe(true);
    expect(getRoleLabel("ADMIN")).toBe("Administrator");
    expect(getRoleLabel("KASIR")).toBe("Kasir");
  });
});
