# Deployment Production — Omni Studio AI

Dokumen ini menjelaskan rilis aplikasi Omni Studio AI dari branch `feature/video-queue` ke production. Pull Request harus direview dan digabungkan ke `main` sebelum proses rilis. Jangan pernah menyimpan API key, cookie, private key, atau file `.env` di repository.

## Arsitektur release

Aplikasi terdiri dari frontend React/Vite yang dibundel bersama server Express/tRPC, database MySQL/TiDB melalui Drizzle ORM, storage S3-compatible, dan worker render video Node.js berbasis SQLite lokal atau adapter database yang setara. Worker memanggil provider video melalui adapter HTTP menggunakan environment variable.

| Komponen | Perintah/konfigurasi | Catatan production |
|---|---|---|
| Web server | `pnpm build` lalu `pnpm start` | Jangan hardcode port; gunakan `PORT` dari platform |
| Database aplikasi | `DATABASE_URL` + migrasi Drizzle | Jalankan migrasi sebelum traffic dialihkan |
| Render worker | `pnpm worker` | Jalankan sebagai service terpisah dengan storage database persisten |
| Render satu siklus | `pnpm worker:once` | Cocok untuk scheduler/cron atau smoke test |
| Queue inspection | `pnpm worker:inspect` | Jangan membuka endpoint inspeksi ke publik |
| Provider video | `VIDEO_PROVIDER_BASE_URL` | Adapter generik; sesuaikan endpoint provider resmi |
| Storage | Helper storage bawaan aplikasi | Simpan URL/key, bukan bytes media di database |

## Prasyarat

Gunakan Node.js `>=22.5` karena worker memakai `node:sqlite` dan menjalankan Node dengan flag `--experimental-sqlite`. Instal pnpm yang kompatibel dengan `packageManager` di `package.json`, lalu lakukan checkout commit yang akan dirilis.

```bash
git clone https://github.com/fajarputra-aank/kost.git
cd kost
git checkout main
pnpm install --frozen-lockfile
```

Untuk environment yang tidak menyediakan `node:sqlite`, ganti adapter `video-queue/db.mjs` dengan client database production yang memiliki transaksi atomik dan lease job. Jangan mengganti klaim atomik dengan pembacaan lalu update terpisah tanpa transaksi.

## Environment variables

Masukkan secret melalui secret manager platform hosting. Nilai contoh di bawah ini adalah nama variable saja dan bukan credential.

| Variable | Wajib | Tujuan |
|---|---:|---|
| `DATABASE_URL` | Ya | Koneksi MySQL/TiDB aplikasi |
| `JWT_SECRET` | Ya | Signing session |
| `OAUTH_SERVER_URL` | Ya | Backend OAuth |
| `VITE_APP_ID` | Ya | OAuth app ID frontend |
| `VITE_OAUTH_PORTAL_URL` | Ya | Portal login |
| `BUILT_IN_FORGE_API_URL` | Ya | Built-in Manus API endpoint |
| `BUILT_IN_FORGE_API_KEY` | Ya | Built-in Manus API server key |
| `VITE_FRONTEND_FORGE_API_URL` | Ya | Built-in API endpoint frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | Ya | Built-in API frontend key |
| `GEMINI_API_KEY` | Jika video aktif | Provider Gemini/Veo server-side key |
| `VIDEO_PROVIDER_BASE_URL` | Jika worker aktif | Base URL adapter provider video |
| `VIDEO_PROVIDER_API_KEY` | Jika worker aktif | Key untuk provider video |
| `VIDEO_QUEUE_DB` | Worker | Path database SQLite queue persisten |
| `VIDEO_QUEUE_POLL_MS` | Worker | Interval polling, default `5000` |
| `VIDEO_QUEUE_LEASE_SECONDS` | Worker | Lease job, default `120` |
| `VIDEO_QUEUE_MAX_ATTEMPTS` | Worker | Batas retry, default `3` |

Environment variable yang diawali `VITE_` dapat masuk ke bundle frontend. Jangan pernah menaruh secret server-only seperti `GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, atau `VIDEO_PROVIDER_API_KEY` dalam variable `VITE_`.

## Database migration

Backup database dan lakukan dry-run review terhadap migration yang dihasilkan. Jalankan migration dalam urutan sebelum web deployment menerima traffic baru.

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Pastikan schema aplikasi dan database berada pada versi yang sama. Migration harus non-destruktif atau memiliki prosedur backup/rollback yang sudah diuji. Jangan menjalankan `DROP TABLE`, `TRUNCATE`, atau perubahan kolom yang menghapus data pada production tanpa approval dan backup terverifikasi.

## Build dan web release

```bash
pnpm check
pnpm test
pnpm build
NODE_ENV=production PORT=3000 pnpm start
```

Health check minimum adalah halaman utama, endpoint OAuth callback, endpoint tRPC yang memerlukan auth, dan akses database. Setelah smoke test lulus, alihkan traffic melalui mekanisme rolling/blue-green deployment platform hosting. Pastikan process manager mengirim SIGTERM dan menunggu request aktif selesai sebelum shutdown.

## Worker release

Worker harus berjalan sebagai service terpisah dengan satu atau lebih instance. Batas concurrency per pengguna tetap satu pada starter kit. Gunakan volume persisten untuk `VIDEO_QUEUE_DB`; jika filesystem ephemeral, gunakan adapter database terkelola sebelum production.

```bash
export VIDEO_QUEUE_DB=/var/lib/omni-studio/video-queue.sqlite
pnpm worker:once
pnpm worker
```

Untuk scheduler, jalankan `pnpm worker:once` secara periodik sebagai alternatif daemon. Worker harus memiliki akses outbound ke provider video dan akses tulis ke database/storage. Monitor jumlah job `queued`, umur job tertua, `failed` rate, attempts, dan notifikasi yang belum tersampaikan.

## Smoke test queue tanpa provider berbayar

Smoke test ini memastikan schema SQLite dan worker dapat membuka database tanpa membuat render provider.

```bash
VIDEO_QUEUE_DB=/tmp/omni-queue-smoke.sqlite pnpm worker:once
VIDEO_QUEUE_DB=/tmp/omni-queue-smoke.sqlite pnpm worker:inspect
```

Untuk integration test provider, gunakan sandbox/mock endpoint yang mengembalikan `operationId`, status `rendering`, lalu `completed` dengan URL fixture. Jangan memulai render berbayar pada pipeline CI kecuali ada budget, quota, dan approval eksplisit.

## Observability dan incident response

Log structured event untuk `job_claimed`, `provider_started`, `provider_polled`, `job_completed`, `job_failed`, dan `notification_created`. Redact prompt sensitif, token, Authorization header, dan URL signed yang memiliki query credential. Alert ketika job tertua melampaui SLA, queue terus bertambah, provider error rate meningkat, atau database lease mengalami konflik.

Jika worker gagal, hentikan deployment worker baru, pertahankan database queue, dan jalankan `pnpm worker:once` setelah root cause diperbaiki. Jika web release gagal, rollback ke commit image sebelumnya; jangan menghapus row queue atau migration untuk melakukan rollback aplikasi.

## Checklist sebelum rilis

- Pull Request telah direview dan branch `main` berisi commit yang disetujui.
- `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, dan `pnpm build` lulus.
- Secret telah dimasukkan melalui secret manager, bukan repository.
- Database backup dan migration review selesai.
- Storage, OAuth, database, provider video, dan worker connectivity telah diuji.
- Worker memiliki volume persisten atau adapter database production yang sesuai.
- Health check, log redaction, alert, rollback plan, dan owner on-call tersedia.
- Smoke test queue telah dijalankan tanpa membuat render berbayar.

## Catatan status implementasi

Repository saat ini menyediakan worker SQLite dan adapter provider generik sebagai starter implementation. Sebelum production dengan traffic nyata, lakukan hardening pada authentication/authorization worker, gunakan database terkelola untuk queue bila filesystem tidak persisten, tambahkan integration test provider sandbox, dan tinjau batasan lisensi/kuota provider video.
