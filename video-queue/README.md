# Video Render Queue Starter

Starter kit ini mendefinisikan kontrak awal untuk antrean render video. Implementasi produksi dapat mengganti adapter penyedia video tanpa mengubah model antreannya.

## Struktur

```text
video-queue/
├── README.md
├── config.example.json
├── render-queue.ts
└── notifications.ts
```

## Lifecycle

Setiap job bergerak melalui `queued`, `rendering`, lalu `completed` atau `failed`. Worker harus mengklaim job secara atomik, membatasi concurrency per pengguna, menyimpan `operationId` penyedia video, dan menggunakan `idempotencyKey` agar retry tidak membuat render ganda.

## Kontrak minimum

| Field | Tujuan |
|---|---|
| `id` | Identitas internal job |
| `userId` | Isolasi data dan otorisasi |
| `prompt` | Arahan video |
| `platform` | Target sosial media |
| `aspectRatio` | Rasio output, misalnya `9:16` |
| `durationSeconds` | Durasi yang diizinkan provider |
| `status` | Status lifecycle job |
| `operationId` | ID operasi asynchronous provider |
| `outputUrl` | URL MP4 setelah selesai |
| `errorMessage` | Informasi kegagalan yang aman ditampilkan |

Template ini tidak menyertakan API key atau kredensial. Simpan secret hanya di secret manager/environment variable.
