import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
});
