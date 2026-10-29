# Handoff: Redesain Rampung ("Buku Kas")

## Overview
Redesain visual menyeluruh untuk **Rampung** (repo `fjrmhri/Rampung`, branch `main`), aplikasi Next.js untuk mencatat pengeluaran bersama dalam grup, menghitung saldo bersih real-time, dan menyarankan pelunasan minimum. **Fungsi, alur, dan konten tidak berubah**. Yang berubah: token warna, tipografi, hierarki, layout responsif, state interaktif, dan aksesibilitas. Ada juga tiga fitur kecil baru (bagian "Fitur baru").

## About the Design Files
File `.dc.html` di folder ini adalah **referensi desain dalam HTML**: prototipe yang menunjukkan tampilan dan perilaku yang diinginkan, **bukan kode produksi untuk disalin**. Tugasnya adalah **membangun ulang desain ini di codebase yang ada**: Next.js 16 App Router, React 19, Tailwind CSS 4, lucide-react, TanStack Query. Ikuti pola repo (kelas Tailwind, token di `src/app/globals.css`). Tidak perlu library baru.

Cara membuka: sajikan folder ini dengan server statis (misalnya `npx serve .`), lalu buka `Rampung.dc.html`. Parameter URL:
- `?p=` = `login | verifikasi | dashboard | buat | gabung | grup | tambah | edit | settlement`
- `&s=` = `kosong | loading | error | invalid | isi | lunas`
- `&m=` = `hapusGrup | hapusPengeluaran | konflik | lunas`
- `&add=1` membuka form anggota tanpa akun; `&t=dark` mengaktifkan mode gelap.

`Rampung Redesign.dc.html` berisi analisis, semua frame desktop (1440) dan mobile (375), state, tabel handoff, dan token. `Design System.dc.html` berisi token dan komponen beserta state-nya.

## Fidelity
**High-fidelity.** Warna, tipografi, spacing, radius, dan state sudah final. Bangun ulang sedekat mungkin, memakai kelas Tailwind yang dipetakan ke token di bawah.

## Prinsip layout global
- Container konten: `max-width: 1120px`, padding horizontal `clamp(16px, 4vw, 32px)`, padding atas `clamp(24px, 4vw, 40px)`, bawah 72px.
- Responsif **tanpa breakpoint khusus**: pakai `flex-wrap` dengan basis flex dan `grid-template-columns: repeat(auto-fill, minmax(min(100%, Npx), 1fr))`. Di Tailwind, gunakan nilai arbitrer, misalnya `grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]`, atau breakpoint `sm`/`lg` yang setara.
- Pola dua kolom (Detail Grup, Form Pengeluaran): kolom utama `flex: 999 1 560px` (form: 520px), aside `flex: 1 1 300px` (form: 280px), `gap: 24px`. Di bawah sekitar 900px otomatis bertumpuk.
- Target sentuh minimal 44px untuk tombol utama dan 40px untuk tombol ikon dan tombol kecil.
- Ukuran teks minimal 12px. Hapus semua `text-[10px]` dan `text-[11px]`.
- Semua nominal memakai `font-variant-numeric: tabular-nums` (`tabular-nums`). Format saldo: `+Rp 140.000`, `−Rp 70.000` (tanda minus U+2212 di depan "Rp"), `Rp 0`.

## Screens / Views

### 1. Navbar (`src/app/(dashboard)/layout.tsx`)
- Sticky, tinggi 64px, latar `--background` 92% + `backdrop-blur(8px)`, border bawah `--border`.
- Kiri: kotak 12×12 radius 3px `--primary` + wordmark "Rampung" (19px/800, tracking -0.02em). Area klik ke /dashboard.
- Kanan (gap 8px): email (14px, `--muted-foreground`, ellipsis, **tidak disembunyikan** di mobile); tombol tema 40×40 (ikon Moon/Sun, aria-label "Mode gelap"/"Mode terang"); tombol "Keluar" (min-h 40px, px 14px, radius 10px, border `--input`, ikon LogOut 14px, 13px/600).

### 2. Login (`src/app/(auth)/login/page.tsx`)
- Tengah layar, max-w 400px. Di atas: kotak 16×16 `--primary`, h1 "Rampung" 32px/800 tracking -0.03em, subjudul 15px "Masuk atau daftar — cukup dengan email".
- Kartu: `--card`, border `--border`, radius 16px, padding 28px, shadow `0 1px 2px fg/4%, 0 8px 24px -12px fg/12%`, gap 20px.
- Banner error (jika `?error`): padding 12px 14px, radius 10px, border/latar/teks destructive, ikon TriangleAlert 16px.
- Label "Alamat Email" 14px/600; input tinggi 46px, padding-x 14px, radius 10px, border `--input`, 15px. Fokus: border `--primary` + `box-shadow: 0 0 0 3px primary/20%`, outline none.
- Tombol "Kirim Link Masuk": full width, tinggi 46px, `--primary`, 15px/700. Pending (gunakan `useFormStatus`): spinner 16px + "Mengirim...", opacity 75%.
- Catatan bawah 13px, tengah, `--muted-foreground`.

### 3. Verifikasi (`login/verifikasi/page.tsx`)
Max-w 420px, tengah. Tile 56×56 radius 16px `--primary-soft` dengan ikon Mail 24px. h1 "Cek email Anda" 28px/800. Email ditebalkan `--foreground`. Kartu info (padding 20px, radius 16px) dengan judul tebal. Tautan "Kembali ke halaman login" memakai warna `--primary` dan underline.

### 4. Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
- Header flex-wrap, rata bawah, gap 20px: h1 "Daftar Grup" `clamp(26px, 3vw, 32px)`/800; subjudul 15px. Aksi: "Gabung Grup" (sekunder, ikon UserPlus) dan "Buat Grup" (primer, ikon Plus), min-h 44px.
- Grid kartu `minmax(min(100%, 300px), 1fr)`, gap 16px. Kartu: padding 20px, radius 16px, border `--border`, gap 16px. Nama 17px/800 ellipsis; "N anggota" 13px dengan ikon Users 14px; ChevronRight 18px. Footer dipisah border-top `--muted`: "Kode: **a1b2c3d4**" (Geist Mono 600) dan tanggal "12 Okt". Hover: border primary/50%, `--shadow-md`, translateY(-1px), transisi 150ms. Fokus: outline 2px primary offset 2px.
- Loading: 3 kartu skeleton tinggi 148px (bar 18px 60%, 12px 35%, 12px 80%, warna `oklch(0.93 0.008 85)`), animasi pulse 1.6s.
- Error: banner destructive radius 16px dengan teks "Gagal memuat daftar grup: {pesan}".
- Kosong: kartu dashed 1.5px `--input`, tile 52px `--primary-soft` ikon Users, h2 "Belum Memiliki Grup" 19px/800, teks max-w 400px, dua tombol.

### 5. Buat Grup dan Gabung Grup (`grup/baru`, `grup/gabung`)
- Max-w 560px. Tautan kembali (ikon ArrowLeft, 14px/600, `--muted-foreground`, hover `--foreground`, min-h 44px).
- Kartu padding `clamp(20px, 4vw, 32px)`, gap 24px. Header: tile 44px radius 12px `--primary-soft` + h1 22px/800 + deskripsi 14px.
- Field gap 8px, label 14px/600, tanda wajib `*` warna `--destructive`, "(Opsional)" 13px/500 muted.
- Buat Grup: emoji diganti kotak info (ikon Info 16px, latar `--muted`, 13px/1.55).
- Gabung Grup: input kode dengan ikon KeyRound di kiri (padding-left 42px), Geist Mono 15px, tracking 0.04em.
- Tombol submit full width 46px. **Disabled**: latar `--disabled-bg`, teks `--disabled-fg`, `cursor-not-allowed` (bukan opacity 50%). Loading: spinner + "Membuat Grup..." / "Memproses...".

### 6. Detail Grup (`grup/[grupId]/page.tsx`)
- Tautan kembali, lalu header flex-wrap rata bawah: h1 nama grup `clamp(26px, 3.2vw, 34px)`/800 tracking -0.03em + badge "Admin" (ikon ShieldCheck, pill `--primary-soft`/`--primary-hover`, 12px/700); "Dibuat pada 12 Oktober 2026" 14px muted. Aksi di kanan: "Penyelesaian Utang (Settlement)" (gaya accent, ikon Sparkles) dan "Tambah Pengeluaran" (primer, ikon CirclePlus).
- **Kolom utama:**
  - Kartu "Saldo Bersih Anggota" (ikon Wallet 20px primary, h2 18px/800). Pill "Real-time Live": titik 7px `oklch(0.55 0.14 150)` dengan pulse, latar positive-soft, teks `oklch(0.40 0.10 150)`. Grid `minmax(min(100%, 190px), 1fr)` gap 12px. Tile: padding 16px, radius 12px; piutang memakai positive-soft/positive-border, utang memakai negative-soft/negative-border, imbang memakai card/border. Nama 14px/700; status 12px/700 dengan ikon TrendingUp/TrendingDown/Scale 13px; nominal 22px/800 tracking -0.02em warna status; caption 13px muted ("Berhak menerima pembayaran" / "Wajib membayar" / "Tidak ada tagihan/utang").
  - Kartu "Riwayat Pengeluaran (N)" (ikon Receipt). Item `<article>` radius 12px, padding 16px, gap 14px. Judul 16px/700, badge jenis split (radius 6px `--primary-soft`, 12px/700), badge versi `v2` (Geist Mono 12px, latar `--muted`, aria-label "Versi data 2"). Meta 13px "Dibayar oleh **Nama** · 14 Okt, 12.30". Nominal 17px/800. Tombol ikon Edit (PenLine) dan Hapus (Trash2) 40×40 radius 10px **dengan aria-label**; hover edit memakai `--muted` + primary, hover hapus memakai destructive-soft + destructive. Pembagian: border-top dashed, grid `minmax(min(100%, 150px), 1fr)` gap 8px, chip padding 7px 10px radius 8px.
  - Kosong: "Belum ada saldo tercatat." dan kotak dashed dengan tombol tautan "Catat pengeluaran pertama" + ArrowRight.
- **Aside:**
  - Kartu Kode Undangan: label 12px/700 uppercase tracking 0.08em; kode Geist Mono 24px/700 tracking 0.06em; tombol "Salin" (sekunder 40px) yang berganti menjadi "Tersalin" (positive, ikon Check) selama 2 detik. **Baru:** blok tautan undangan (lihat Fitur baru).
  - Kartu "Anggota Grup (N)": tombol "Tambah Anggota Tanpa Akun" (min-h 44px, border dashed primary/50%, latar primary-soft/50%). Form inline: padding 16px radius 12px, input 44px, Simpan (primer) dan Batal (sekunder). Baris anggota: avatar 36px bulat (berakun memakai primary-soft/primary-hover, tanpa akun memakai `oklch(0.94 0.008 85)`), nama 14px/700, "Bergabung 12 Okt" 12px; badge "Pemilik" (accent); status "Berakun" (ikon UserCheck positive) / "Tanpa Akun" (ikon UserX `--warning`). **Label selalu tampil**, termasuk di mobile.
  - Tombol "Hapus Grup" full width, outline destructive-border, teks `--destructive-fg-soft`, hover destructive-soft.

### 7. Form Pengeluaran (`components/pengeluaran/FormPengeluaran.tsx`, `pengeluaran/baru`, `[id]/edit`)
- Max-w 1000px. Header tile 44px (CirclePlus / PenLine) + h1 `clamp(22px, 2.6vw, 28px)` ("Catat Pengeluaran Baru" / "Edit Pengeluaran") + "Grup: **Nama**" / "Versi saat ini: **v2**" (mono).
- Banner error yang bisa ditutup (tombol X 28px aria-label "Tutup pesan").
- **Kiri:** kartu 1 berisi Deskripsi, lalu grid `auto-fit minmax(min(100%, 220px), 1fr)` berisi Jumlah Total (prefix "Rp" absolut di kiri 14px, input 17px/800, padding-left 44px) dan Dibayar Oleh (select 46px). Kartu 2: "Pilih Jenis Pembagian (Split)" lalu **segmented control** `role="radiogroup"`: 3 kolom, wadah latar `--muted` padding 4px radius 12px. Opsi min-h 60px radius 9px, ikon 18px (Users / ChartPie / Banknote) di atas label 13px/700. Terpilih: latar card, border primary/35%, teks `--primary-hover`, shadow `0 1px 3px fg/12%`. Header "Anggota yang Ditanggung (x/y)" + tombol teks "Pilih Semua"/"Batal Pilih Semua". Baris anggota min-h 56px radius 12px; terpilih memakai border primary/30% + latar primary-soft/45%. Checkbox 20px `accent-color: var(--primary)`. Input persentase 72px, nominal 128px, tinggi 36px, rata kanan. **Hapus `max-h-60 overflow-y-auto`**.
- **Kanan (sticky top 88px):** "Jumlah Total (Rp)" 13px, nilai 28px/800; daftar ringkasan (Dibayar Oleh, Jenis Pembagian, Anggota yang Ditanggung); status validasi (positive-soft + CircleCheck, atau destructive-soft + TriangleAlert dengan `errorText` dari `hitungHasilSplit`); tombol submit 48px ("Tambah Pengeluaran" / "Simpan Perubahan"). Disabled jika tidak valid; loading "Menyimpan Pengeluaran...".
- Dialog konflik versi: gaya Dialog standar, tombol kanan primer "Muat Ulang Data Terbaru" dengan RefreshCw.

### 8. Settlement (`grup/[grupId]/settlement/page.tsx`, `components/settlement/RekapSaldo.tsx`)
- Max-w 920px. h1 `clamp(24px, 3vw, 32px)` + ikon Sparkles 22px `--accent-strong`; subjudul 14px; pill "Real-time Sync".
- "Rekomendasi Transaksi Pembayaran": baris flex-wrap padding 14px 16px radius 12px latar `oklch(0.985 0.005 85)`. Chip "dari" memakai negative-soft/negative, ArrowRight, chip "ke" memakai positive-soft/positive (padding 6px 12px, radius 8px, 14px/700). Kanan: nominal 18px/800 + tombol "Tandai Lunas" (primer 40px, ikon Check). Jika kosong: panel positive "Seluruh Utang Sudah Lunas & Impas!" dengan CircleCheck 40px.
- RekapSaldo: header + tombol CSV (primer, Download) dan PDF (sekunder, FileText) 40px. Grid tile `minmax(min(100%, 190px), 1fr)`: nama, status berwarna, saldo, "Total Pengeluaran", "Jumlah Transaksi". "Rincian Pengeluaran per Anggota": blok radius 12px dengan header latar `oklch(0.97 0.006 85)` dan baris item; **jenis split tampil sebagai label** ("Sama Rata"), bukan enum.
- Riwayat Pelunasan: baris flex-wrap "**Dari** melunasi ke **Ke**", nominal positive, pill "Lunas".

### 9. Dialog (pola umum)
Overlay `fixed inset-0` dengan `foreground/50%` + blur 2px, padding 16px. Panel max-w 420px, padding 24px, radius 16px, `--shadow-lg`, gap 16px. Tile ikon 40px radius 12px di kiri judul (h3 18px/800). Isi 14px/1.6 muted. Tombol rata kanan, wrap, min-h 44px. Wajib `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, fokus awal ke "Batal", Escape menutup, fokus kembali ke pemicu.

## Fitur baru (rekomendasi yang disetujui)
1. **Konfirmasi Tandai Lunas.** Klik "Tandai Lunas" tidak langsung mencatat. Simpan transaksi di state `pendingTx`, lalu buka Dialog: tile CircleCheck (positive-soft/positive), judul "Tandai Lunas?", isi "Pastikan pembayaran ini sudah benar-benar dilakukan. Setelah ditandai, saldo kedua anggota langsung diperbarui dan transaksi masuk ke Riwayat Pelunasan.", ringkasan transaksi (chip dari → ke + nominal 17px/800), tombol "Batal" dan "Ya, Tandai Lunas" (primer). Konfirmasi memanggil `handleLunas`.
2. **Salin tautan undangan.** Di kartu Kode Undangan, di bawah border-top: teks 13px "Atau bagikan tautan, kode akan terisi otomatis:", kotak URL (Geist Mono 12px, latar `--muted`, radius 8px, ellipsis), tombol "Salin Tautan" (primer 40px, ikon Link) yang berganti menjadi "Tautan tersalin" selama 2 detik. Nilai: `${window.location.origin}/grup/gabung?kode=${grup.kode_undangan}`.
3. **Mode gelap.** Toggle di navbar menambah/menghapus class `dark` pada `<html>` (sesuai `@custom-variant dark` yang sudah ada). Simpan pilihan di localStorage dan pakai `prefers-color-scheme` sebagai default. Hindari kedipan tema dengan script inline kecil di `<head>`.

## Interactions & Behavior
- Transisi warna dan border 150ms ease. Hover kartu grup menaikkan kartu 1px.
- Fokus: semua elemen interaktif memakai `outline: 2px solid var(--ring); outline-offset: 2px` (`focus-visible:`). Input memakai ring 3px primary/20%.
- Spinner: lingkaran 16px border 2px currentColor dengan sisi kanan transparan, rotasi 0.8s linear. Bisa juga `LoaderCircle` + `animate-spin`.
- Skeleton: `animate-pulse` 1.6s.
- Validasi form mengikuti `hitungHasilSplit` tanpa perubahan logika.
- Salin kode/tautan: feedback 2 detik.

## State Management
Tidak ada state global baru. State tambahan per halaman:
- `settlement/page.tsx`: `pendingTx: {dariId, keId, jumlah} | null`.
- `grup/[grupId]/page.tsx`: `linkCopied: boolean`.
- Layout: `theme: 'light' | 'dark'` (localStorage key `rampung-theme`).

Hook dan query yang sudah ada tidak berubah.

## Design Tokens
Font: **Plus Jakarta Sans** (400, 500, 600, 700, 800) via `next/font/google`, menggantikan Inter. **Geist Mono** tetap. Body 15px/1.5.

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--background` | `oklch(0.982 0.006 85)` #fbf9f5 | `oklch(0.19 0.008 70)` #161310 | Latar halaman |
| `--card` | `oklch(0.998 0.002 85)` #fffefd | `oklch(0.23 0.01 70)` #201c18 | Kartu, input, tombol sekunder |
| `--muted` | `oklch(0.955 0.008 85)` #f3f0ea | `oklch(0.28 0.01 70)` #2c2824 | Hover sekunder, chip pembagian, latar segmented |
| `--border` | `oklch(0.905 0.01 80)` #e3dfd8 | `oklch(0.33 0.012 70)` #39342f | Garis kartu |
| `--input` | `oklch(0.83 0.012 80)` #cbc7bf | `oklch(0.42 0.012 70)` #514c46 | Garis input, tombol sekunder |
| `--foreground` | `oklch(0.23 0.015 60)` #221b16 | `oklch(0.95 0.008 85)` #f1eee9 | Teks utama |
| `--muted-foreground` | `oklch(0.47 0.015 60)` #615953 | `oklch(0.76 0.012 80)` #b5b0a9 | Teks sekunder, caption |
| `--primary` | `oklch(0.44 0.085 162)` #196144 | `oklch(0.74 0.11 162)` #63c095 | Tombol utama, tautan, ikon judul, ring fokus |
| `--primary-hover` | `oklch(0.38 0.08 162)` #074f35 | `oklch(0.82 0.10 162)` #86d9b0 | Hover tombol utama; teks di atas primary-soft |
| `--primary-foreground` | `oklch(0.99 0.005 162)` #f9fdfb | `oklch(0.18 0.02 162)` #09140f | Teks di atas primary |
| `--primary-soft` | `oklch(0.945 0.03 162)` #dcf4e7 | `oklch(0.30 0.045 162)` #163527 | Badge Admin/jenis split, tile ikon, baris anggota terpilih |
| `--disabled-bg` | `oklch(0.90 0.015 162)` #d6e1db | `oklch(0.32 0.02 162)` #2a3630 | Tombol primer disabled |
| `--disabled-fg` | `oklch(0.42 0.03 162)` #3f5248 | `oklch(0.70 0.03 162)` #8fa599 | Teks tombol disabled |
| `--accent` | `oklch(0.95 0.045 85)` #fcedcd | `oklch(0.31 0.045 80)` #3c2e14 | Tombol Settlement, badge Pemilik |
| `--accent-border` | `oklch(0.85 0.07 80)` #e6c99a | `oklch(0.45 0.07 80)` #6a5124 | Border tombol Settlement |
| `--accent-foreground` | `oklch(0.40 0.09 65)` #683c00 | `oklch(0.85 0.10 80)` #f0c781 | Teks di atas accent |
| `--accent-strong` | `oklch(0.62 0.12 75)` #b07a20 | `oklch(0.78 0.13 80)` #e3ad4b | Ikon sparkles (dekoratif) |
| `--positive` | `oklch(0.42 0.11 150)` #0b5d2a | `oklch(0.82 0.12 150)` #89da9b | Piutang, Lunas, nominal pelunasan |
| `--positive-soft` | `oklch(0.95 0.035 150)` #dff6e2 | `oklch(0.29 0.045 150)` #1a321f | Latar piutang, status valid, pill Real-time |
| `--positive-border` | `oklch(0.86 0.06 150)` #b6ddbd | `oklch(0.42 0.06 150)` #34563b | Border kartu piutang |
| `--negative` | `oklch(0.48 0.13 45)` #97400d | `oklch(0.80 0.11 45)` #f9a782 | Utang |
| `--negative-soft` | `oklch(0.965 0.02 45)` #fff0e9 | `oklch(0.27 0.03 45)` #33221a | Latar kartu utang, chip "dari" |
| `--negative-border` | `oklch(0.88 0.05 45)` #f5cebd | `oklch(0.42 0.05 45)` #644436 | Border kartu utang |
| `--destructive` | `oklch(0.50 0.18 27)` #b32322 | `oklch(0.55 0.18 27)` #c53732 | Tombol hapus, tanda wajib (*) |
| `--destructive-fg-soft` | `oklch(0.47 0.18 27)` #a91518 | `oklch(0.80 0.12 27)` #ff9f94 | Teks banner error |
| `--destructive-soft` | `oklch(0.955 0.03 27)` #ffe9e5 | `oklch(0.29 0.05 27)` #41211e | Latar banner error, hover tombol hapus |
| `--destructive-border` | `oklch(0.86 0.07 27)` #fcc0b8 | `oklch(0.45 0.09 27)` #804039 | Border banner error, tombol Hapus Grup |
| `--warning` | `oklch(0.58 0.12 70)` #a76c12 | `oklch(0.78 0.12 75)` #e4ac59 | Ikon UserX (anggota tanpa akun) |

Tipografi: display 32–34/800/-0.03em · h1 26–32/800/-0.025em · h2 18/800/-0.01em · nominal besar 22–28/800 tabular · body 15/400/1.5 · label 14/600 · caption 12–13/500–700 · mono 12–24/600.

Spacing (basis 4px): 4, 8, 12, 16, 20, 24, 32, 40, 56.

Radius: 6px (chip/badge), 8px (input kecil, chip pembagian), 10px (tombol, input, `--radius`), 12px (item list, tile ikon), 16px (kartu, modal), 999px (pill).

Shadow: xs `0 1px 2px oklch(0.23 0.015 60 / 0.04)` · md `0 10px 24px -14px oklch(0.23 0.015 60 / 0.25)` · lg `0 24px 48px -16px oklch(0.23 0.015 60 / 0.35)`.

Blok CSS lengkap untuk `:root` dan `.dark` ada di `Rampung Redesign.dc.html` bagian 5. Daftarkan token baru (positive, negative, accent, warning, `-soft`, `-border`) di `@theme inline` agar tersedia sebagai kelas Tailwind (`bg-positive-soft`, `text-negative`, dan seterusnya). Hapus pemakaian langsung `emerald-*`, `rose-*`, `amber-*`, dan `slate-*`.

## Assets
- Ikon: **lucide-react** (sudah terpasang). Ikon yang dipakai: ArrowLeft, ArrowRight, Banknote, Check, ChartPie, ChevronRight, CircleCheck, CirclePlus, Copy, Download, FileText, History, Info, KeyRound, Link, ListChecks, LogOut, Mail, Moon, PenLine, Plus, Receipt, RefreshCw, Scale, ShieldCheck, Sparkles, Sun, Trash2, TrendingDown, TrendingUp, TriangleAlert, UserCheck, UserPlus, UserX, Users, Wallet, X. Di prototipe, ikon dimuat dari `lucide-static` lewat `Ikon.dc.html`.
- Tidak ada gambar atau logo baru. Wordmark berupa teks dengan kotak warna primer.

## Urutan implementasi yang disarankan
1. Token di `globals.css` (`:root`, `.dark`, `@theme inline`) dan font di `layout.tsx`.
2. Komponen dasar di `src/components/ui/`: Button (primary, secondary, accent, danger, danger-outline, icon, text; state loading dan disabled), Input, Card, Alert, Badge, Dialog, Skeleton.
3. Navbar dan toggle tema, lalu Login dan Verifikasi.
4. Dashboard, Buat Grup, Gabung Grup.
5. Detail Grup, termasuk tautan undangan dan dua dialog.
6. FormPengeluaran (segmented, ringkasan sticky, dialog konflik).
7. Settlement, RekapSaldo, konfirmasi Tandai Lunas, dan ErrorBoundary.
8. QA: kontras dengan axe/Lighthouse, uji di 375px dan 1440px, navigasi keyboard, mode gelap.

## Screenshots
Folder `screenshots/` berisi tangkapan halaman penuh dari prototipe untuk 9 halaman utama: `desktop-*.png` (lebar 1440px) dan `mobile-*.png` (lebar 375px). File diurutkan sesuai alur: 01 login sampai 09 settlement. Screenshot hanya untuk orientasi cepat. Jika ada selisih kecil (misalnya pemenggalan baris teks), prototipe `Rampung.dc.html` dan spesifikasi di README ini yang menjadi acuan. State (kosong, loading, error, modal) dan mode gelap bisa dilihat langsung di prototipe lewat parameter URL.

## Files
- `Rampung.dc.html`: prototipe interaktif semua halaman dan state (sumber utama).
- `Ikon.dc.html`: helper ikon lucide untuk prototipe.
- `Design System.dc.html`: token dan komponen beserta state.
- `Rampung Redesign.dc.html`: analisis, arah desain, semua frame desktop/mobile, tabel pemetaan komponen ke file repo, token CSS.
- `UI Saat Ini.dc.html`: rekreasi UI lama (Detail Grup) sebagai pembanding.
- `support.js`: runtime yang dibutuhkan file `.dc.html` untuk tampil.
