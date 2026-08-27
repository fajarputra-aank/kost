import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: { id: 42, openId: "upgrade-user", name: "Upgrade User", email: "upgrade@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("fitur upgrade studio", () => {
  it("menganalisis kelengkapan prompt berdasarkan komponen kreatif nyata", async () => {
    const result = await appRouter.createCaller(ctx).studio.analyzePrompt({ prompt: "Persona kreator dengan penampilan kulit dan rambut realistis, latar studio, kebutuhan UGC testimoni, framing potret natural." });
    expect(result.score).toBe(100);
    expect(result.checks.every(check => check.pass)).toBe(true);
    expect(result.suggestions).toHaveLength(0);
  });

  it("memberi saran saat prompt belum memiliki konteks penting", async () => {
    const result = await appRouter.createCaller(ctx).studio.analyzePrompt({ prompt: "Karakter yang bagus dengan pencahayaan lembut dan gaya premium." });
    expect(result.score).toBeLessThan(100);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
