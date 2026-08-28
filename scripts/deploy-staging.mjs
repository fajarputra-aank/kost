#!/usr/bin/env node
import { execFileSync } from "node:child_process";

// Staging target configuration is environment-only; never commit real hosts, URLs, or credentials.
const dryRun = process.env.STAGING_DEPLOY !== "1";
const host = process.env.STAGING_SSH_HOST;
const user = process.env.STAGING_SSH_USER ?? "deploy";
const appPath = process.env.STAGING_APP_PATH ?? "/srv/omni-studio-ai";
const healthUrl = process.env.STAGING_HEALTH_URL;
const runMigrations = process.env.STAGING_RUN_MIGRATIONS === "1";

function validateTarget() {
  requireValue("STAGING_SSH_HOST", host);
  requireValue("STAGING_HEALTH_URL", healthUrl);
  if (!/^[a-zA-Z0-9._:-]+$/.test(host)) throw new Error("STAGING_SSH_HOST mengandung karakter tidak aman");
  if (!/^[a-zA-Z0-9._-]+$/.test(user)) throw new Error("STAGING_SSH_USER mengandung karakter tidak aman");
  if (!/^\/(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/.test(appPath)) throw new Error("STAGING_APP_PATH harus berupa absolute path sederhana");
  const parsed = new URL(healthUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("STAGING_HEALTH_URL harus memakai http atau https");
}

function command(program, args, options = {}) {
  const printable = [program, ...args].join(" ");
  if (dryRun) {
    console.log(`[dry-run] ${printable}`);
    return "";
  }
  console.log(`$ ${printable}`);
  return execFileSync(program, args, { stdio: "inherit", ...options });
}

function requireValue(name, value) {
  if (!value) throw new Error(`${name} wajib diisi saat STAGING_DEPLOY=1`);
}

console.log(`Staging deployment ${dryRun ? "dry-run" : "aktif"}`);
console.log("1. Validasi source lokal");
command("pnpm", ["check"]);
command("pnpm", ["test"]);
command("pnpm", ["build"]);

if (dryRun) {
  console.log("2. Target remote belum dieksekusi");
  console.log(`Target konfigurasi: ${user}@${host ?? "<STAGING_SSH_HOST>"}:${appPath}`);
  console.log(`Health URL: ${healthUrl ?? "<STAGING_HEALTH_URL>"}`);
  console.log("Set STAGING_DEPLOY=1, STAGING_SSH_HOST, dan STAGING_HEALTH_URL setelah target disetujui.");
  process.exit(0);
}

validateTarget();
const target = `${user}@${host}`;
const remote = [
  `set -eu`,
  `cd ${appPath}`,
  `git fetch origin main`,
  `git checkout main`,
  `git reset --ff-only origin/main`,
  `pnpm install --frozen-lockfile`,
  ...(runMigrations ? ["pnpm drizzle-kit migrate"] : []),
  "pnpm build",
  "sudo systemctl restart omni-studio-ai-staging.service",
  "sudo systemctl restart omni-video-queue-staging.service",
].join(" && ");

console.log("2. Deploy ke target staging");
command("ssh", ["-o", "BatchMode=yes", target, remote]);
console.log("3. Health check");
command("curl", ["--fail", "--silent", "--show-error", "--max-time", "20", healthUrl]);
console.log("Deployment staging selesai.");
