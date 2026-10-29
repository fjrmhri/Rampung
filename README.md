# Rampung

Rampung adalah aplikasi web untuk mencatat pengeluaran bersama dalam grup dan menyelesaikan utang antar anggota. Setiap pengeluaran dibagi ke anggota grup, saldo bersih dihitung oleh database dan diperbarui secara real-time, lalu aplikasi menyarankan transaksi pelunasan seminimal mungkin.

## Fitur

- Masuk dengan magic link email (Supabase Auth). Akun dibuat otomatis saat pertama kali masuk.
- Buat grup dengan nama tampilan pemilik yang bisa diatur. Pembuat grup otomatis menjadi anggota pertama.
- Gabung ke grup dengan kode undangan (bisa diisi otomatis lewat `/grup/gabung?kode=<kode>`).
- Admin grup dapat menambah anggota tanpa akun dan menghapus grup.
- Catat pengeluaran dengan tiga jenis pembagian: sama rata, persentase, dan nominal pasti.
- Edit pengeluaran dengan optimistic locking (kolom `versi`) untuk mencegah perubahan saling menimpa.
- Saldo bersih per anggota dari view `saldo_bersih`, diperbarui lewat Supabase Realtime.
- Rekomendasi settlement memakai algoritma greedy min-cash-flow berbasis max-heap, lengkap dengan tombol "Tandai Lunas" dan riwayat pelunasan.
- Ekspor rekap saldo dan riwayat pengeluaran ke CSV dan PDF.
- Akses data dibatasi dengan Row Level Security (RLS) di Supabase.

## Tech Stack

| Komponen | Versi |
|---|---|
| [Next.js](https://nextjs.org) (App Router, Turbopack) | 16.4.3 |
| React | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| [Supabase](https://supabase.com) (`@supabase/supabase-js`, `@supabase/ssr`) | ^2.111.0, ^0.12.4 |
| [TanStack Query](https://tanstack.com/query) | ^5.101.4 |
| jsPDF | ^4.2.1 |
| lucide-react | ^1.28.0 |
| Vitest (unit test) | ^4.1.10 |

## Prasyarat

- Node.js 20.9 atau lebih baru (syarat Next.js 16)
- npm (proyek memakai `package-lock.json`)
- Project Supabase dengan autentikasi email aktif

## Instalasi

Dari direktori proyek:

```bash
npm install
```

Siapkan database dengan menjalankan file migrasi secara berurutan di SQL Editor Supabase:

1. `supabase/migrations/0001_init.sql`: tabel, fungsi, trigger, view `saldo_bersih`, policy RLS, dan publikasi Realtime
2. `supabase/migrations/0002_tambah_anggota_tanpa_akun.sql`: RPC `tambah_anggota_tanpa_akun` dan perbaikan policy `grup`
3. `supabase/migrations/0003_hardening_rls.sql`: hardening RLS dan hak akses (butuh PostgreSQL 15+)
4. `supabase/migrations/0004_rpc_pengeluaran.sql`: RPC atomik `simpan_pengeluaran` dan `edit_pengeluaran` (wajib ada sebelum aplikasi dijalankan)

## Konfigurasi

Buat file `.env.local` di root proyek dan isi variabel berikut:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key project Supabase |
| `NEXT_PUBLIC_SITE_URL` | Origin aplikasi untuk tautan magic link, misalnya `http://localhost:3000`. Opsional; jika kosong, origin diambil dari header request. Wajib diisi di produksi |

Kode saat ini tidak membaca `SUPABASE_SERVICE_ROLE_KEY`. Jangan pernah mengekspos service role key ke client.

Di dashboard Supabase (Authentication, URL Configuration), tambahkan `<origin aplikasi>/auth/callback` ke daftar Redirect URLs agar magic link bisa kembali ke aplikasi.

## Menjalankan

```bash
npm run dev
```

Buka `http://localhost:3000`. Pengunjung yang belum masuk akan diarahkan ke `/login`.

Pemeriksaan kode dan unit test:

```bash
npm run lint
npm run test
```

## Struktur Folder

```
.
├── supabase/migrations/        # Skema database, RLS, dan RPC
└── src/
    ├── proxy.ts                # Proxy Next.js: refresh sesi Supabase dan proteksi route /dashboard
    ├── app/
    │   ├── page.tsx            # Route /: redirect ke /dashboard atau /login
    │   ├── (auth)/login/       # Halaman login dan konfirmasi email, server action auth
    │   ├── (dashboard)/        # Layout terproteksi: /dashboard (daftar grup) dan /grup/*
    │   ├── auth/callback/      # Penukaran kode magic link menjadi sesi
    │   └── api/grup/           # POST buat grup, DELETE hapus grup
    ├── components/             # Form pengeluaran, rekap saldo, dan provider
    ├── hooks/                  # Query dan mutation TanStack Query + Realtime
    ├── lib/supabase/           # Klien Supabase untuk browser, server, dan middleware
    ├── types/                  # Tipe data grup, pengeluaran, saldo, settlement
    └── utils/                  # Algoritma utang, kalkulasi split, helper CSV, beserta unit test
```

## Build dan Deploy

```bash
npm run build
npm run start
```

`npm run start` menjalankan hasil build di port 3000. Untuk deploy ke platform seperti Vercel, atur `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sebagai environment variable. Tambahkan juga URL `/auth/callback` domain produksi ke Redirect URLs Supabase.

## Lisensi

Proyek ini belum menyertakan file lisensi.

## Penulis

Fajar Muhairi, GitHub: [github.com/fjrmhri](https://github.com/fjrmhri)
