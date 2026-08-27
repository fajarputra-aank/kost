import { describe, expect, it } from "vitest";
import { buildExportManifest, buildStoryboardText, normalizeStoryboardScenes } from "../shared/content";

describe("content utilities", () => {
  it("keeps only complete storyboard scenes", () => {
    const scenes = normalizeStoryboardScenes([{ sceneNumber: 1, duration: 5, visual: "Kamera dekat", dialogue: "Hai", onScreenText: "Baru", shot: "Close-up", status: "needs-review" }, { sceneNumber: 2 }]); expect(scenes).toHaveLength(1); expect(scenes[0]?.status).toBe("needs-review");
    expect(normalizeStoryboardScenes("invalid")).toEqual([]);
  });

  it("formats storyboard text for the batch archive", () => {
    const text = buildStoryboardText("Serum", "Brief natural", [{ sceneNumber: 1, duration: 5, visual: "Kamera dekat", dialogue: "Hai", onScreenText: "Baru", shot: "Close-up", status: "ready" }]);
    expect(text).toContain("SCENE 1"); expect(text).toContain("ready"); expect(text).toContain("Brief natural");
  });

  it("builds an export manifest with prompt and brand context", () => {
    const manifest = buildExportManifest("Kampanye serum", { name: "Merek utama" }, [{ id: 1, title: "Hook", prompt: "Prompt UGC", createdAt: "2026-08-27" }]);
    expect(manifest.assets[0]).toMatchObject({ id: 1, title: "Hook", prompt: "Prompt UGC" });
    expect(manifest.brandKit).toEqual({ name: "Merek utama" });
  });
});

import { createBatchArchive } from "../shared/export";

describe("batch archive", () => {
  it("includes manifest, storyboard files, and available assets", async () => {
    const zip = createBatchArchive({ project: "Serum", brandKit: { name: "Merek" }, assets: [{ id: 1, title: "Hook", prompt: "Prompt", createdAt: "2026-08-27", blob: new Uint8Array([1, 2, 3]) }], storyboard: { title: "Video serum", brief: "Brief", scenes: [{ sceneNumber: 1, duration: 5, visual: "Close-up", dialogue: "Hai", onScreenText: "Baru", shot: "Close-up", status: "draft" }] } });
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(["manifest-konten.json", "storyboard.json", "storyboard.txt", "aset-1.png"]));
  });
});
