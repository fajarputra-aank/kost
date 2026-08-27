import { randomUUID } from "node:crypto";
import { createNotification, claimNextJob, listJobs, openQueueDatabase, updateJob } from "./db.mjs";

const db = openQueueDatabase();
const pollIntervalMs = Number(process.env.VIDEO_QUEUE_POLL_MS ?? 5000);
const leaseSeconds = Number(process.env.VIDEO_QUEUE_LEASE_SECONDS ?? 120);
const providerBaseUrl = process.env.VIDEO_PROVIDER_BASE_URL;
const providerApiKey = process.env.VIDEO_PROVIDER_API_KEY;

function headers() {
  return { "content-type": "application/json", ...(providerApiKey ? { authorization: `Bearer ${providerApiKey}` } : {}) };
}

async function startProvider(job) {
  if (!providerBaseUrl) throw new Error("VIDEO_PROVIDER_BASE_URL belum dikonfigurasi");
  const response = await fetch(`${providerBaseUrl.replace(/\/$/, "")}/renders`, { method: "POST", headers: headers(), body: JSON.stringify({ prompt: job.prompt, aspectRatio: job.aspect_ratio, durationSeconds: job.duration_seconds, idempotencyKey: job.idempotency_key }) });
  if (!response.ok) throw new Error(`Provider start gagal (${response.status})`);
  const body = await response.json();
  if (!body.operationId) throw new Error("Provider tidak mengembalikan operationId");
  return body.operationId;
}

async function pollProvider(operationId) {
  if (!providerBaseUrl) throw new Error("VIDEO_PROVIDER_BASE_URL belum dikonfigurasi");
  const response = await fetch(`${providerBaseUrl.replace(/\/$/, "")}/renders/${encodeURIComponent(operationId)}`, { headers: headers() });
  if (!response.ok) throw new Error(`Provider poll gagal (${response.status})`);
  return response.json();
}

function terminalNotification(job, status, outputUrl, errorMessage) {
  const completed = status === "completed";
  return { eventId: `${job.id}:${status}`, userId: job.user_id, renderJobId: job.id, status, title: completed ? "Video MP4 siap" : "Render video gagal", message: completed ? "Render video selesai dan siap diunduh." : (errorMessage ?? "Provider video gagal."), outputUrl };
}

export async function processUser(userId) {
  const job = claimNextJob(db, userId, leaseSeconds);
  if (!job) return { status: "idle", userId };
  try {
    const operationId = job.operation_id ?? await startProvider(job);
    updateJob(db, job.id, { operation_id: operationId, status: "rendering" });
    const result = await pollProvider(operationId);
    if (result.status === "completed") {
      updateJob(db, job.id, { status: "completed", output_url: result.outputUrl ?? null, error_message: null, lease_until: null });
      createNotification(db, terminalNotification(job, "completed", result.outputUrl, undefined));
      return { status: "completed", id: job.id };
    }
    if (result.status === "failed") {
      updateJob(db, job.id, { status: "failed", error_message: result.errorMessage ?? "Provider video gagal.", lease_until: null });
      createNotification(db, terminalNotification(job, "failed", undefined, result.errorMessage));
      return { status: "failed", id: job.id };
    }
    updateJob(db, job.id, { status: "rendering" });
    return { status: "rendering", id: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker error";
    const attempts = Number(job.attempts) + 1;
    const failed = attempts >= Number(process.env.VIDEO_QUEUE_MAX_ATTEMPTS ?? 3);
    updateJob(db, job.id, { status: failed ? "failed" : "queued", attempts, error_message: message, lease_until: null });
    if (failed) createNotification(db, terminalNotification(job, "failed", undefined, message));
    return { status: failed ? "failed" : "retrying", id: job.id, message };
  }
}

export async function runOnce() {
  const users = db.prepare("SELECT DISTINCT user_id FROM render_jobs WHERE status IN ('queued', 'rendering') ORDER BY user_id").all();
  const results = [];
  for (const { user_id: userId } of users) results.push(await processUser(userId));
  return results;
}

if (process.argv.includes("--inspect")) {
  console.log(JSON.stringify(listJobs(db), null, 2));
} else if (process.argv.includes("--once")) {
  console.log(JSON.stringify(await runOnce(), null, 2));
} else {
  console.log(`Video queue worker aktif; polling setiap ${pollIntervalMs} ms`);
  while (true) {
    await runOnce();
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

export function createDraftJob(input) {
  return { id: randomUUID(), userId: input.userId, prompt: input.prompt, platform: input.platform, aspectRatio: input.aspectRatio, durationSeconds: input.durationSeconds, idempotencyKey: input.idempotencyKey ?? randomUUID() };
}
