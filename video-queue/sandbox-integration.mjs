import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enqueueJob, listJobs, openQueueDatabase } from "./db.mjs";

const root = await mkdtemp(join(tmpdir(), "omni-video-sandbox-"));
const database = join(root, "queue.sqlite");
const providerPort = 8787;
const provider = spawn(process.execPath, ["video-queue/sandbox-provider.mjs"], { env: { ...process.env, SANDBOX_PROVIDER_PORT: String(providerPort) }, stdio: "inherit" });

try {
  await new Promise(resolve => setTimeout(resolve, 250));
  const db = openQueueDatabase(database);
  enqueueJob(db, { id: "sandbox-job-1", userId: "team-demo", prompt: "Video demo aplikasi kost", platform: "TikTok", aspectRatio: "9:16", durationSeconds: 4, idempotencyKey: "sandbox-idempotency-1" });
  db.close();

  const result = spawn(process.execPath, ["--experimental-sqlite", "video-queue/worker.mjs", "--once"], { env: { ...process.env, VIDEO_QUEUE_DB: database, VIDEO_PROVIDER_BASE_URL: `http://127.0.0.1:${providerPort}`, VIDEO_QUEUE_MAX_ATTEMPTS: "1" }, stdio: "inherit" });
  const exitCode = await new Promise(resolve => result.on("exit", code => resolve(code ?? 1)));
  if (exitCode !== 0) throw new Error(`worker exited with code ${exitCode}`);

  const check = openQueueDatabase(database);
  const jobs = listJobs(check);
  const notifications = check.prepare("SELECT * FROM render_notifications ORDER BY created_at DESC").all();
  check.close();
  if (jobs[0]?.status !== "completed") throw new Error(`expected completed job, got ${jobs[0]?.status}`);
  if (notifications.length !== 1 || notifications[0].status !== "completed") throw new Error("expected one completed notification");
  console.log(JSON.stringify({ ok: true, job: jobs[0], notification: notifications[0] }, null, 2));
} finally {
  provider.kill("SIGTERM");
  await rm(root, { recursive: true, force: true });
}
