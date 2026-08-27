import { describe, expect, it } from "vitest";

describe("Gemini API secret", () => {
  it("authenticates against the lightweight models endpoint", async () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key, "GEMINI_API_KEY must be configured").toBeTruthy();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key ?? "")}`);
    expect(response.ok, `Gemini models endpoint returned ${response.status}`).toBe(true);
  }, 20_000);
});
