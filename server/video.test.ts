import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => { process.env.GEMINI_API_KEY = "ci-test-key"; return null; });
const storageMock = vi.hoisted(() => ({ storagePut: vi.fn() }));
vi.mock("./storage", () => storageMock);

import { pollVeoRender, startVeoRender } from "./_core/videoGeneration";

describe("Gemini Veo adapter", () => {
  beforeEach(() => { vi.restoreAllMocks(); storageMock.storagePut.mockResolvedValue({ key: "videos/7/render.mp4", url: "/manus-storage/videos/7/render.mp4" }); });

  it("starts an asynchronous Veo operation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: "operations/veo-123" }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await startVeoRender("Video UGC vertikal untuk peluncuran serum", "9:16");
    expect(result.name).toBe("operations/veo-123");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("veo-3.1-generate-preview:predictLongRunning"), expect.objectContaining({ method: "POST" }));
  });

  it("downloads completed output and stores it as MP4", async () => {
    const operationResponse = { ok: true, json: async () => ({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri: "https://generativelanguage.googleapis.com/download/video" } }] } } }) };
    const videoResponse = { ok: true, arrayBuffer: async () => new Uint8Array([0, 1, 2, 3]).buffer };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(operationResponse).mockResolvedValueOnce(videoResponse));
    const result = await pollVeoRender("operations/veo-123", 7);
    expect(result.status).toBe("completed");
    expect(result.videoUrl).toContain("/manus-storage/");
    expect(storageMock.storagePut).toHaveBeenCalledWith(expect.stringContaining("videos/7/"), expect.any(Buffer), "video/mp4");
  });
});
