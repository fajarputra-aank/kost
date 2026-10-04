import { describe, expect, it } from "vitest";
import { canAccessAdminPage, canDeleteData, getPageAccess } from "./access";

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
});
