import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openQueueDatabase(filename = process.env.VIDEO_QUEUE_DB ?? "./data/video-queue.sqlite") {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS render_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      platform TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('9:16', '16:9')),
      duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (4, 6, 8)),
      status TEXT NOT NULL CHECK (status IN ('queued', 'rendering', 'completed', 'failed')) DEFAULT 'queued',
      operation_id TEXT,
      output_url TEXT,
      error_message TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT NOT NULL UNIQUE,
      lease_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_render_jobs_claim ON render_jobs(user_id, status, created_at);
    CREATE TABLE IF NOT EXISTS render_notifications (
      event_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      render_job_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      output_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function enqueueJob(db, job) {
  db.prepare(`INSERT INTO render_jobs (id, user_id, prompt, platform, aspect_ratio, duration_seconds, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING`).run(job.id, job.userId, job.prompt, job.platform, job.aspectRatio, job.durationSeconds, job.idempotencyKey);
  return db.prepare("SELECT * FROM render_jobs WHERE id = ?").get(job.id);
}

export function claimNextJob(db, userId, leaseSeconds = 120) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + leaseSeconds * 1000).toISOString();
  const tx = db.createSession();
  try {
    db.exec("BEGIN IMMEDIATE");
    const job = db.prepare(`SELECT * FROM render_jobs WHERE user_id = ? AND (status = 'queued' OR (status = 'rendering' AND lease_until < ?)) ORDER BY created_at ASC LIMIT 1`).get(userId, now.toISOString());
    if (!job) { db.exec("COMMIT"); return undefined; }
    db.prepare("UPDATE render_jobs SET status = 'rendering', lease_until = ?, updated_at = datetime('now') WHERE id = ?").run(leaseUntil, job.id);
    db.exec("COMMIT");
    return db.prepare("SELECT * FROM render_jobs WHERE id = ?").get(job.id);
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  } finally {
    tx.close();
  }
}

export function updateJob(db, id, patch) {
  const fields = Object.keys(patch);
  if (!fields.length) return db.prepare("SELECT * FROM render_jobs WHERE id = ?").get(id);
  const values = fields.map(field => patch[field]);
  const assignments = fields.map(field => `${field} = ?`).join(", ");
  db.prepare(`UPDATE render_jobs SET ${assignments}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return db.prepare("SELECT * FROM render_jobs WHERE id = ?").get(id);
}

export function listJobs(db, limit = 50) {
  return db.prepare("SELECT * FROM render_jobs ORDER BY created_at DESC LIMIT ?").all(limit);
}

export function notificationExists(db, eventId) {
  return Boolean(db.prepare("SELECT event_id FROM render_notifications WHERE event_id = ?").get(eventId));
}

export function createNotification(db, notification) {
  db.prepare(`INSERT INTO render_notifications (event_id, user_id, render_job_id, status, title, message, output_url) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`).run(notification.eventId, notification.userId, notification.renderJobId, notification.status, notification.title, notification.message, notification.outputUrl ?? null);
}
