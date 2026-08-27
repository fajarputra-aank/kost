import { beforeEach, describe, expect, it, vi } from "vitest";

const heartbeatMocks = vi.hoisted(() => ({ deleteHeartbeatJob: vi.fn() }));
const videoMocks = vi.hoisted(() => ({ startVeoRender: vi.fn(), pollVeoRender: vi.fn() }));
const dbMocks = vi.hoisted(() => ({ getVideoRenderByTaskUid: vi.fn(), listQueuedVideoRenders: vi.fn(), getActiveVideoRender: vi.fn(), startVideoRender: vi.fn(), updateVideoRender: vi.fn(), createStudioNotification: vi.fn() }));
vi.mock("./_core/heartbeat", () => heartbeatMocks);
vi.mock("./_core/videoGeneration", () => videoMocks);
vi.mock("./db", () => dbMocks);

import { processVideoRenderTask } from "./videoQueue";

describe("video render queue worker", () => {
  beforeEach(() => { vi.clearAllMocks(); heartbeatMocks.deleteHeartbeatJob.mockResolvedValue(undefined); dbMocks.updateVideoRender.mockResolvedValue(undefined); });

  it("starts only the first queued item and forwards its duration preset", async () => {
    const queued = { id: 11, userId: 7, operationName: "queued://11", prompt: "Prompt video yang cukup panjang untuk render", aspectRatio: "9:16", durationSeconds: 6, status: "queued", queuePosition: 1, scheduleCronTaskUid: "task-11", notificationSentAt: null };
    dbMocks.getVideoRenderByTaskUid.mockResolvedValue(queued); dbMocks.listQueuedVideoRenders.mockResolvedValue([queued]); dbMocks.getActiveVideoRender.mockResolvedValue(undefined); videoMocks.startVeoRender.mockResolvedValue({ name: "operations/11" }); dbMocks.updateVideoRender.mockResolvedValue({ ...queued, operationName: "operations/11", status: "rendering" }); videoMocks.pollVeoRender.mockResolvedValue({ status: "rendering", operation: {} });
    const result = await processVideoRenderTask("task-11", "session-token");
    expect(videoMocks.startVeoRender).toHaveBeenCalledWith(queued.prompt, "9:16", 6);
    expect(result.status).toBe("rendering");
  });

  it("persists one completion notification and removes the heartbeat task", async () => {
    const rendering = { id: 12, userId: 7, operationName: "operations/12", prompt: "Prompt video yang cukup panjang untuk render", aspectRatio: "16:9", durationSeconds: 8, status: "rendering", queuePosition: 1, scheduleCronTaskUid: "task-12", notificationSentAt: null };
    dbMocks.getVideoRenderByTaskUid.mockResolvedValue(rendering); videoMocks.pollVeoRender.mockResolvedValue({ status: "completed", videoUrl: "/manus-storage/videos/7/12.mp4", operation: {} }); dbMocks.createStudioNotification.mockResolvedValue({ id: 5 });
    const result = await processVideoRenderTask("task-12", "session-token");
    expect(result).toMatchObject({ status: "completed", videoUrl: "/manus-storage/videos/7/12.mp4" });
    expect(dbMocks.createStudioNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, renderId: 12, kind: "render_completed" }));
    expect(heartbeatMocks.deleteHeartbeatJob).toHaveBeenCalledWith("task-12", "session-token");
  });
});
