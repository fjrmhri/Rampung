-- ================================================================
-- RAMPUNG — Migrasi Fase 3 (Tambah Anggota Tanpa Akun + RLS fix)
-- Gabungan 0002 dan 0003: fungsi tambah anggota tanpa akun + perbaikan
-- policy agar pembuat grup tetap bisa mengakses row grup setelah insert.
-- ================================================================

create schema if not exists public;
set search_path = public, pg_catalog;

create or replace function public.tambah_anggota_tanpa_akun(p_grup_id uuid, p_nama text)
returns uuid
language plpgsql security definer
as $$
declare
  v_anggota_id uuid;
begin
  -- Pastikan pemanggil adalah admin/pembuat grup
  if not public.is_group_admin(p_grup_id) then
    raise exception 'Hanya pembuat/admin grup yang dapat menambah anggota tanpa akun';
  end if;

  -- Validasi nama tidak boleh kosong
  if p_nama is null or trim(p_nama) = '' then
    raise exception 'Nama anggota tidak boleh kosong';
  end if;

  -- Insert anggota tanpa akun (user_id = null)
  insert into public.anggota_grup (grup_id, user_id, nama_tampilan)
  values (p_grup_id, null, trim(p_nama))
  returning id into v_anggota_id;

  return v_anggota_id;
end;
$$;

alter policy "grup_select_anggota" on public.grup
  using (
    is_member_of_group(id)
    or dibuat_oleh = auth.uid()
  );
