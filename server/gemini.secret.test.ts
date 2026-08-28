import { describe, expect, it } from "vitest";

describe("Gemini API secret", () => {
  it.skipIf(!process.env.GEMINI_API_KEY)("authenticates against the lightweight models endpoint", async () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeTruthy();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key ?? "")}`);
    expect(response.ok, `Gemini models endpoint returned ${response.status}`).toBe(true);
  }, 20_000);
});
