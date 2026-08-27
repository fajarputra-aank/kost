import { deleteHeartbeatJob } from "./_core/heartbeat";
import { pollVeoRender, startVeoRender } from "./_core/videoGeneration";
import * as db from "./db";

const terminalStatuses = new Set(["completed", "failed"]);

export async function processVideoRenderTask(taskUid: string, sessionToken: string) {
  const current = await db.getVideoRenderByTaskUid(taskUid);
  if (!current) return { ok: true as const, status: "skipped" as const };
  if (terminalStatuses.has(current.status)) {
    await cleanupHeartbeat(current.scheduleCronTaskUid, sessionToken);
    return { ok: true as const, status: current.status };
  }

  let render = current;
  if (render.status === "queued") {
    const [nextQueued] = await db.listQueuedVideoRenders(render.userId, 1);
    if (nextQueued && nextQueued.id !== render.id) return { ok: true as const, status: "queued" as const, queuePosition: render.queuePosition };
    const active = await db.getActiveVideoRender(render.userId, render.id);
    if (active) return { ok: true as const, status: "queued" as const, queuePosition: render.queuePosition };
    try {
      const operation = await startVeoRender(render.prompt, render.aspectRatio, render.durationSeconds as 4 | 6 | 8);
      render = await db.updateVideoRender(render.userId, render.id, { operationName: operation.name, status: "rendering" }) ?? render;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Render video gagal dimulai";
      await db.updateVideoRender(render.userId, render.id, { status: "failed", errorMessage: message });
      await notifyOnce(render, "render_failed", "Render video gagal", message);
      await cleanupHeartbeat(render.scheduleCronTaskUid, sessionToken);
      return { ok: false as const, status: "failed" as const, errorMessage: message };
    }
  }

  try {
    const result = await pollVeoRender(render.operationName, render.userId);
    if (result.status === "rendering") {
      await db.updateVideoRender(render.userId, render.id, { status: "rendering" });
      return { ok: true as const, status: "rendering" as const };
    }
    if (result.status === "failed") {
      await db.updateVideoRender(render.userId, render.id, { status: "failed", errorMessage: result.errorMessage ?? "Render video gagal" });
      await notifyOnce(render, "render_failed", "Render video gagal", result.errorMessage ?? "Gemini mengembalikan error.");
      await cleanupHeartbeat(render.scheduleCronTaskUid, sessionToken);
      return { ok: false as const, status: "failed" as const, errorMessage: result.errorMessage };
    }
    await db.updateVideoRender(render.userId, render.id, { status: "completed", videoUrl: result.videoUrl, errorMessage: null, notificationSentAt: new Date() });
    await notifyOnce(render, "render_completed", "Video MP4 siap", "Render Gemini Anda selesai dan siap diunduh.");
    await cleanupHeartbeat(render.scheduleCronTaskUid, sessionToken);
    return { ok: true as const, status: "completed" as const, videoUrl: result.videoUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render video gagal diproses";
    await db.updateVideoRender(render.userId, render.id, { status: "failed", errorMessage: message });
    await notifyOnce(render, "render_failed", "Render video gagal", message);
    await cleanupHeartbeat(render.scheduleCronTaskUid, sessionToken);
    return { ok: false as const, status: "failed" as const, errorMessage: message };
  }
}

async function notifyOnce(render: { id: number; userId: number; notificationSentAt: Date | null }, kind: "render_completed" | "render_failed", title: string, message: string) {
  if (render.notificationSentAt) return;
  await db.createStudioNotification({ userId: render.userId, renderId: render.id, kind, title, message });
  await db.updateVideoRender(render.userId, render.id, { notificationSentAt: new Date() });
}

async function cleanupHeartbeat(taskUid: string | null, sessionToken: string) {
  if (!taskUid || !sessionToken) return;
  try { await deleteHeartbeatJob(taskUid, sessionToken); } catch { /* cleanup is best effort; terminal state remains durable */ }
}
