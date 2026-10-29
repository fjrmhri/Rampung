-- ================================================================
-- RAMPUNG — Migrasi 0003 (Hardening RLS)
--   1. View `saldo_bersih` dijalankan dengan hak pemanggil
--      (security_invoker) agar RLS tabel dasar ikut berlaku.
--   2. Role `anon` tidak lagi punya akses ke tabel, view, dan fungsi.
--   3. Update `anggota_grup` dibatasi ke kolom `nama_tampilan`, sehingga
--      `grup_id`/`user_id` tidak bisa diganti untuk masuk ke grup lain.
--   4. Pembagian, pelunasan, dan pembayar pengeluaran wajib merujuk
--      anggota dari grup yang sama.
--   5. `search_path` dikunci pada `tambah_anggota_tanpa_akun`.
-- Butuh PostgreSQL 15+ untuk opsi security_invoker.
-- ================================================================

set search_path = public, pg_catalog;

-- 1. VIEW saldo_bersih
alter view public.saldo_bersih set (security_invoker = true);

-- 2. Cabut akses anon. Fungsi juga dicabut dari PUBLIC (default Postgres),
--    lalu diberikan lagi hanya ke authenticated.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon, public;
grant execute on function
  public.is_member_of_group(uuid),
  public.is_group_admin(uuid),
  public.gabung_grup(text, text),
  public.tambah_anggota_tanpa_akun(uuid, text)
to authenticated;

-- 3. ANGGOTA_GRUP — hanya nama_tampilan yang boleh diubah lewat API
revoke update on public.anggota_grup from authenticated;
grant update (nama_tampilan) on public.anggota_grup to authenticated;

-- 4. Anggota yang dirujuk harus satu grup
alter policy "pengeluaran_update_anggota" on public.pengeluaran
  using (is_member_of_group(grup_id))
  with check (
    is_member_of_group(grup_id)
    and exists (
      select 1 from anggota_grup ag
      where ag.id = pengeluaran.dibayar_oleh and ag.grup_id = pengeluaran.grup_id
    )
  );

alter policy "pembagian_all_anggota" on public.pembagian_pengeluaran
  using (exists (select 1 from pengeluaran p where p.id = pembagian_pengeluaran.pengeluaran_id and is_member_of_group(p.grup_id)))
  with check (
    exists (
      select 1 from pengeluaran p
      join anggota_grup ag on ag.grup_id = p.grup_id
      where p.id = pembagian_pengeluaran.pengeluaran_id
        and ag.id = pembagian_pengeluaran.anggota_id
        and is_member_of_group(p.grup_id)
    )
  );

alter policy "pelunasan_insert_anggota" on public.transaksi_pelunasan
  with check (
    is_member_of_group(grup_id)
    and exists (select 1 from anggota_grup ag where ag.id = transaksi_pelunasan.dari_anggota_id and ag.grup_id = transaksi_pelunasan.grup_id)
    and exists (select 1 from anggota_grup ag where ag.id = transaksi_pelunasan.ke_anggota_id and ag.grup_id = transaksi_pelunasan.grup_id)
  );

alter policy "pelunasan_update_anggota" on public.transaksi_pelunasan
  using (is_member_of_group(grup_id))
  with check (
    is_member_of_group(grup_id)
    and exists (select 1 from anggota_grup ag where ag.id = transaksi_pelunasan.dari_anggota_id and ag.grup_id = transaksi_pelunasan.grup_id)
    and exists (select 1 from anggota_grup ag where ag.id = transaksi_pelunasan.ke_anggota_id and ag.grup_id = transaksi_pelunasan.grup_id)
  );

-- 5. Hardening fungsi SECURITY DEFINER dari migrasi 0002
alter function public.tambah_anggota_tanpa_akun(uuid, text) set search_path = public;
