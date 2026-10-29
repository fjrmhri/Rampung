-- ================================================================
-- RAMPUNG — Migrasi Awal (Fase 1)
-- Basis: rampung-technical-blueprint.md bagian 2, dengan perbaikan:
--   1. jenis_split ditambah 'persentase' (spesifikasi MVP: Equal/Percentage/Exact)
--   2. Kolom `versi` + trigger auto-increment di `pengeluaran` (optimistic locking)
--   3. View `saldo_bersih` ditulis ulang: versi asli melakukan LEFT JOIN
--      langsung ke pengeluaran & pembagian_pengeluaran dalam satu query lalu
--      GROUP BY — ini menyebabkan fan-out (baris pengeluaran x baris
--      pembagian saling mengalikan), terbukti secara empiris memberi saldo
--      salah saat satu anggota punya >1 baris di kedua sisi. Diperbaiki
--      dengan agregasi terpisah (subquery) sebelum join, dan sekarang
--      turut memperhitungkan transaksi_pelunasan berstatus 'lunas'.
--   4. Join-via-kode_undangan dipindah dari (potensi) insert langsung
--      menjadi RPC `gabung_grup()` SECURITY DEFINER — mencegah user
--      men-insert dirinya ke grup manapun hanya dengan mengetahui/menebak
--      grup_id (grup_id bisa saja bocor lewat URL), tanpa punya kode_undangan.
-- ================================================================

create schema if not exists public;
set search_path = public, pg_catalog;

create type public.jenis_split as enum ('sama_rata', 'persentase', 'nominal_pasti');

create table public.grup (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kode_undangan text not null unique default substr(md5(random()::text), 1, 8),
  dibuat_oleh uuid not null references auth.users(id) on delete cascade,
  dibuat_pada timestamptz not null default now()
);

-- user_id nullable -> mendukung "anggota tanpa akun" (ditambahkan manual oleh admin grup)
create table public.anggota_grup (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nama_tampilan text not null,
  bergabung_pada timestamptz not null default now(),
  unique (grup_id, user_id)
);

create table public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup(id) on delete cascade,
  dibayar_oleh uuid not null references public.anggota_grup(id) on delete restrict,
  deskripsi text not null,
  jumlah_total bigint not null check (jumlah_total > 0), -- satuan Rupiah, integer (hindari floating point)
  jenis_split jenis_split not null default 'sama_rata',
  versi integer not null default 1, -- optimistic locking: client wajib kirim versi yg dibaca saat UPDATE
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create table public.pembagian_pengeluaran (
  id uuid primary key default gen_random_uuid(),
  pengeluaran_id uuid not null references public.pengeluaran(id) on delete cascade,
  anggota_id uuid not null references public.anggota_grup(id) on delete cascade,
  jumlah_tanggungan bigint not null check (jumlah_tanggungan >= 0),
  persentase numeric(5,2), -- hanya diisi saat jenis_split = 'persentase'; jumlah_tanggungan tetap sumber kebenaran saldo
  unique (pengeluaran_id, anggota_id)
);

create table public.transaksi_pelunasan (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup(id) on delete cascade,
  dari_anggota_id uuid not null references public.anggota_grup(id) on delete cascade,
  ke_anggota_id uuid not null references public.anggota_grup(id) on delete cascade,
  jumlah bigint not null check (jumlah > 0),
  status text not null default 'pending' check (status in ('pending', 'lunas')),
  dibuat_pada timestamptz not null default now(),
  lunas_pada timestamptz
);

create index idx_pengeluaran_grup on public.pengeluaran(grup_id);
create index idx_pembagian_pengeluaran_anggota on public.pembagian_pengeluaran(anggota_id);
create index idx_pembagian_pengeluaran_pengeluaran on public.pembagian_pengeluaran(pengeluaran_id);
create index idx_transaksi_grup on public.transaksi_pelunasan(grup_id);
create index idx_anggota_grup_user on public.anggota_grup(user_id);

-- ----------------------------------------------------------------
-- FUNGSI HELPER — SECURITY DEFINER agar query internalnya tidak lagi
-- kena RLS (mencegah rekursi tak berhingga saat dipakai di policy tabel
-- yang sama), search_path dikunci utk hardening.
-- ----------------------------------------------------------------
create function public.is_member_of_group(target_grup_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.anggota_grup
    where public.anggota_grup.grup_id = target_grup_id
    and public.anggota_grup.user_id = auth.uid()
  );
$$;

create function public.is_group_admin(target_grup_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.grup
    where public.grup.id = target_grup_id
    and public.grup.dibuat_oleh = auth.uid()
  );
$$;

-- ----------------------------------------------------------------
-- Pembuat grup otomatis jadi anggota pertama
-- ----------------------------------------------------------------
create function public.tangani_grup_baru()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.anggota_grup (grup_id, user_id, nama_tampilan)
  select new.id, new.dibuat_oleh, coalesce(u.email, 'Pemilik Grup')
  from auth.users u where u.id = new.dibuat_oleh;
  return new;
end;
$$;

create trigger saat_grup_baru
  after insert on public.grup
  for each row execute function public.tangani_grup_baru();

-- ----------------------------------------------------------------
-- Optimistic locking: versi naik otomatis tiap UPDATE.
-- Client HARUS menyertakan `.eq('versi', versiTerakhirDibaca)` saat
-- update; 0 baris ter-update = konflik, klien wajib refetch.
-- ----------------------------------------------------------------
create function public.naikkan_versi_pengeluaran()
returns trigger
language plpgsql
as $$
begin
  new.versi = old.versi + 1;
  new.diperbarui_pada = now();
  return new;
end;
$$;

create trigger sebelum_update_pengeluaran
  before update on public.pengeluaran
  for each row execute function public.naikkan_versi_pengeluaran();

-- ----------------------------------------------------------------
-- RPC: satu-satunya jalur join grup berakun. Parameter yg dipakai
-- adalah kode_undangan (rahasia yg dibagikan admin), BUKAN grup_id,
-- sehingga tidak ada policy INSERT langsung yang perlu dibuka di
-- anggota_grup untuk kasus ini.
-- ----------------------------------------------------------------
create function public.gabung_grup(kode text, nama text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  target_grup_id uuid;
  nama_final text;
begin
  select id into target_grup_id from public.grup where kode_undangan = kode;
  if target_grup_id is null then
    raise exception 'Kode undangan tidak valid';
  end if;

  select coalesce(nama, u.email, 'Anggota') into nama_final
  from auth.users u where u.id = auth.uid();

  insert into public.anggota_grup (grup_id, user_id, nama_tampilan)
  values (target_grup_id, auth.uid(), nama_final)
  on conflict (grup_id, user_id) do nothing;

  return target_grup_id;
end;
$$;

-- ----------------------------------------------------------------
-- VIEW: saldo bersih per anggota (lihat catatan perbaikan di header file)
-- ----------------------------------------------------------------
create view public.saldo_bersih as
select
  ag.id as anggota_id,
  ag.grup_id,
  coalesce(dibayar.total, 0)
    - coalesce(ditanggung.total, 0)
    - coalesce(pelunasan_keluar.total, 0)
    + coalesce(pelunasan_masuk.total, 0) as saldo
from public.anggota_grup ag
left join (
  select dibayar_oleh as anggota_id, sum(jumlah_total) as total
  from public.pengeluaran group by dibayar_oleh
) dibayar on dibayar.anggota_id = ag.id
left join (
  select anggota_id, sum(jumlah_tanggungan) as total
  from public.pembagian_pengeluaran group by anggota_id
) ditanggung on ditanggung.anggota_id = ag.id
left join (
  select dari_anggota_id as anggota_id, sum(jumlah) as total
  from public.transaksi_pelunasan where status = 'lunas' group by dari_anggota_id
) pelunasan_keluar on pelunasan_keluar.anggota_id = ag.id
left join (
  select ke_anggota_id as anggota_id, sum(jumlah) as total
  from public.transaksi_pelunasan where status = 'lunas' group by ke_anggota_id
) pelunasan_masuk on pelunasan_masuk.anggota_id = ag.id;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table public.grup enable row level security;
alter table public.anggota_grup enable row level security;
alter table public.pengeluaran enable row level security;
alter table public.pembagian_pengeluaran enable row level security;
alter table public.transaksi_pelunasan enable row level security;

-- GRUP
create policy "grup_select_anggota" on public.grup for select
  using (is_member_of_group(id));
create policy "grup_insert_user_login" on public.grup for insert
  with check (dibuat_oleh = auth.uid());
create policy "grup_update_admin" on public.grup for update
  using (dibuat_oleh = auth.uid());
create policy "grup_delete_admin" on public.grup for delete
  using (dibuat_oleh = auth.uid());

-- ANGGOTA_GRUP — sengaja TANPA policy insert: satu-satunya jalur masuk
-- adalah trigger saat_grup_baru (pemilik) dan RPC gabung_grup (anggota lain).
-- Menambah "anggota tanpa akun" juga disarankan lewat RPC serupa di Fase 3
-- (tambah_anggota_tanpa_akun), bukan insert langsung dari client.
create policy "anggota_grup_select_sesama" on public.anggota_grup for select
  using (is_member_of_group(grup_id));
create policy "anggota_grup_update_admin_atau_diri" on public.anggota_grup for update
  using (user_id = auth.uid() or is_group_admin(grup_id));
create policy "anggota_grup_delete_admin_atau_diri" on public.anggota_grup for delete
  using (user_id = auth.uid() or is_group_admin(grup_id));

-- PENGELUARAN — model kolaboratif: semua anggota grup boleh kelola semua
-- baris pengeluaran di grup tsb (lazim di aplikasi split-bill spt Splitwise).
create policy "pengeluaran_select_sesama" on public.pengeluaran for select
  using (is_member_of_group(grup_id));
create policy "pengeluaran_insert_anggota" on public.pengeluaran for insert
  with check (
    is_member_of_group(grup_id)
    and exists (
      select 1 from anggota_grup ag
      where ag.id = pengeluaran.dibayar_oleh and ag.grup_id = pengeluaran.grup_id
    )
  );
create policy "pengeluaran_update_anggota" on public.pengeluaran for update
  using (is_member_of_group(grup_id));
create policy "pengeluaran_delete_anggota" on public.pengeluaran for delete
  using (is_member_of_group(grup_id));

-- PEMBAGIAN_PENGELUARAN
create policy "pembagian_select_sesama" on public.pembagian_pengeluaran for select
  using (exists (select 1 from pengeluaran p where p.id = pembagian_pengeluaran.pengeluaran_id and is_member_of_group(p.grup_id)));
create policy "pembagian_all_anggota" on public.pembagian_pengeluaran for all
  using (exists (select 1 from pengeluaran p where p.id = pembagian_pengeluaran.pengeluaran_id and is_member_of_group(p.grup_id)));

-- TRANSAKSI_PELUNASAN
create policy "pelunasan_select_sesama" on public.transaksi_pelunasan for select
  using (is_member_of_group(grup_id));
create policy "pelunasan_insert_anggota" on public.transaksi_pelunasan for insert
  with check (is_member_of_group(grup_id));
create policy "pelunasan_update_anggota" on public.transaksi_pelunasan for update
  using (is_member_of_group(grup_id));

-- ================================================================
-- GRANT PRIVILEGES
-- Pastikan role Supabase dapat menggunakan schema public dan tabelnya.
-- RLS masih akan membatasi row-level access sesuai policy di atas.
-- ================================================================
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated, anon;
grant usage on all sequences in schema public to authenticated, anon;
grant execute on all functions in schema public to authenticated, anon;

-- ================================================================
-- REALTIME — tabel yg perlu di-subscribe klien utk sinkronisasi live
-- ================================================================
alter publication supabase_realtime add table pengeluaran;
alter publication supabase_realtime add table pembagian_pengeluaran;
alter publication supabase_realtime add table transaksi_pelunasan;
alter publication supabase_realtime add table anggota_grup;
