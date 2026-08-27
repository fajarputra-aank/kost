export type RenderStatus = "queued" | "rendering" | "completed" | "failed";

export interface RenderJob {
  id: string;
  userId: string;
  prompt: string;
  platform: string;
  aspectRatio: "9:16" | "16:9";
  durationSeconds: 4 | 6 | 8;
  status: RenderStatus;
  operationId?: string;
  outputUrl?: string;
  errorMessage?: string;
  attempts: number;
  idempotencyKey: string;
}

export interface VideoProvider {
  start(input: Pick<RenderJob, "prompt" | "aspectRatio" | "durationSeconds">): Promise<{ operationId: string }>;
  poll(operationId: string): Promise<{ status: "rendering" | "completed" | "failed"; outputUrl?: string; errorMessage?: string }>;
}

export interface QueueStore {
  claimNext(userId: string): Promise<RenderJob | undefined>;
  update(id: string, patch: Partial<RenderJob>): Promise<RenderJob>;
}

export async function processNextRender(store: QueueStore, provider: VideoProvider, userId: string) {
  const job = await store.claimNext(userId);
  if (!job) return undefined;

  try {
    const operation = job.operationId
      ? { operationId: job.operationId }
      : await provider.start(job);
    await store.update(job.id, { status: "rendering", operationId: operation.operationId });

    const result = await provider.poll(operation.operationId);
    if (result.status === "completed") {
      return store.update(job.id, { status: "completed", outputUrl: result.outputUrl, errorMessage: undefined });
    }
    if (result.status === "failed") {
      return store.update(job.id, { status: "failed", errorMessage: result.errorMessage ?? "Video provider failed" });
    }
    return store.update(job.id, { status: "rendering" });
  } catch (error) {
    return store.update(job.id, {
      status: job.attempts + 1 < 3 ? "queued" : "failed",
      attempts: job.attempts + 1,
      errorMessage: error instanceof Error ? error.message : "Unknown render error",
    });
  }
}
