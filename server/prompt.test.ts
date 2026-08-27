import { describe, expect, it } from "vitest";
import { buildGenerationPrompt } from "../shared/prompt";

describe("buildGenerationPrompt", () => {
  it("assembles every studio control into reusable prompt metadata", () => {
    const prompt = buildGenerationPrompt({
      persona: "Founder-led creator",
      appearance: "Warm olive skin, dark wavy hair",
      expression: "Warm direct-to-camera smile",
      outfit: "Minimal cream knitwear",
      setting: "Sunlit apartment kitchen",
      shotType: "Vertical close-up selfie",
      useCase: "TikTok product testimonial",
    });

    expect(prompt).toContain("Persona: Founder-led creator.");
    expect(prompt).toContain("Penampilan: Warm olive skin, dark wavy hair.");
    expect(prompt).toContain("Latar: Sunlit apartment kitchen.");
    expect(prompt).toContain("Kebutuhan UGC: TikTok product testimonial.");
    expect(prompt).toContain("tanpa watermark");
  });
});
