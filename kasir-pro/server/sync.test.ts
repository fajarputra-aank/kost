import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function userContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 7,
      openId: `sync-${role}`,
      name: role === "admin" ? "Admin" : "Kasir",
      email: `${role}@example.com`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("sync procedures", () => {
  it("rejects snapshot pulls without an authenticated user", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.sync.pull()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects snapshot pushes without an authenticated user", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.sync.push({ baseVersion: 0, payload: "{}" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects entity removal for a non-admin authenticated user", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.data.remove({ entity: "products", baseVersion: 0, id: "product-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
