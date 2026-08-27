import { describe, expect, it } from "vitest";
import { DEFAULT_PLATFORM_PRESETS, captionFromTemplate } from "./platforms";

describe("platform presets", () => {
  it("ships a tailored default for every supported platform", () => {
    expect(DEFAULT_PLATFORM_PRESETS).toHaveLength(4);
    expect(DEFAULT_PLATFORM_PRESETS.find(item => item.platform === "LinkedIn")?.aspectRatio).toBe("16:9");
    expect(DEFAULT_PLATFORM_PRESETS.every(item => [4, 6, 8].includes(item.durationSeconds))).toBe(true);
  });

  it("renders the brief into a platform caption template", () => {
    expect(captionFromTemplate("Hook: {brief} #ugc", "  Serum baru hadir  ")).toBe("Hook: Serum baru hadir #ugc");
  });
});
