# Spesifikasi Kalender Video dan Preset Sosial Media

## Tujuan

Fitur ini menghubungkan hasil render video dengan jadwal publikasi konten. Pengguna dapat melihat konten per bulan, memindahkan jadwal, memfilter berdasarkan kanal/status, dan memilih preset output yang sesuai dengan platform.

## Kalender konten

Kalender menggunakan zona waktu pengguna untuk tampilan, tetapi menyimpan timestamp dalam UTC. Setiap item memiliki `id`, `userId`, `scheduledFor`, `channel`, `status`, `caption`, dan referensi ke render atau aset sumber.

Status minimum adalah `draft`, `scheduled`, `published`, dan `failed`. Drag-and-drop hanya boleh mengubah `scheduledFor` setelah server memeriksa kepemilikan item. Filter bulan memakai rentang inklusif awal bulan dan eksklusif awal bulan berikutnya agar tidak terjadi masalah batas waktu.

| Filter | Nilai contoh | Perilaku |
|---|---|---|
| Bulan | `2026-09` | Menampilkan item pada bulan tersebut |
| Kanal | `TikTok`, `Instagram Reels`, `YouTube Shorts`, `LinkedIn` | Menyaring platform publikasi |
| Status | `draft`, `scheduled`, `published`, `failed` | Menyaring lifecycle konten |

## Preset sosial media

Preset harus dapat dikustomisasi per pengguna dan disimpan berdasarkan pasangan `userId + platform`. Nilai default berikut adalah titik awal, bukan batas permanen provider:

| Platform | Rasio | Durasi awal | Gaya caption |
|---|---:|---:|---|
| TikTok | 9:16 | 8 detik | Hook singkat, ritme cepat, hashtag relevan |
| Instagram Reels | 9:16 | 8 detik | Hook natural, manfaat produk, CTA ringan |
| YouTube Shorts | 9:16 | 6 detik | Judul langsung, satu pesan utama, CTA jelas |
| LinkedIn | 16:9 | 8 detik | Profesional, berbasis insight, tanpa clickbait |

Template caption menggunakan placeholder `{brief}`, `{product}`, `{cta}`, dan `{hashtags}`. Placeholder yang tidak tersedia harus dihapus atau diganti dengan fallback aman; jangan mengirim caption mentah dengan token placeholder kepada pengguna.

## Notifikasi render

Saat job berpindah ke `completed`, sistem membuat event idempotent `render.completed` yang berisi link MP4. Saat berpindah ke `failed`, sistem membuat event `render.failed` dengan pesan yang aman. Event ID wajib unik per transisi terminal agar polling dan retry tidak mengirim notifikasi duplikat.

## Kriteria penerimaan

1. Dua job dari pengguna yang sama tidak dirender bersamaan jika batas concurrency adalah satu.
2. Retry mempertahankan `operationId` yang sudah ada dan tidak membuat operasi provider kedua.
3. Drag-and-drop lintas tanggal memperbarui jadwal hanya untuk pemilik item.
4. Filter kalender dapat dikombinasikan bulan, kanal, dan status.
5. Perubahan preset tidak memengaruhi preset pengguna lain.
6. Notifikasi selesai hanya muncul sekali dan menyediakan URL MP4 ketika tersedia.
7. Tidak ada API key atau secret yang disimpan dalam repository.
