-- ================================================================
-- RAMPUNG — Migrasi 0004 (RPC atomik pengeluaran)
-- Tambah dan edit pengeluaran beserta pembagiannya dijalankan dalam
-- satu transaksi: jika salah satu langkah gagal, semua dibatalkan.
-- Fungsi memakai SECURITY INVOKER sehingga policy RLS tetap berlaku.
-- Konflik optimistic locking dilaporkan dengan SQLSTATE 'PT409'
-- (diteruskan PostgREST sebagai HTTP 409).
-- ================================================================

set search_path = public, pg_catalog;

create or replace function public.simpan_pengeluaran(
  p_grup_id uuid,
  p_dibayar_oleh uuid,
  p_deskripsi text,
  p_jumlah_total bigint,
  p_jenis_split public.jenis_split,
  p_pembagian jsonb
)
returns public.pengeluaran
language plpgsql security invoker
set search_path = public
as $$
declare
  v_pengeluaran public.pengeluaran;
begin
  insert into public.pengeluaran (grup_id, dibayar_oleh, deskripsi, jumlah_total, jenis_split, versi)
  values (p_grup_id, p_dibayar_oleh, p_deskripsi, p_jumlah_total, p_jenis_split, 1)
  returning * into v_pengeluaran;

  insert into public.pembagian_pengeluaran (pengeluaran_id, anggota_id, jumlah_tanggungan, persentase)
  select
    v_pengeluaran.id,
    (item->>'anggota_id')::uuid,
    (item->>'jumlah_tanggungan')::bigint,
    (item->>'persentase')::numeric
  from jsonb_array_elements(p_pembagian) as item;

  return v_pengeluaran;
end;
$$;

create or replace function public.edit_pengeluaran(
  p_id uuid,
  p_versi_terakhir integer,
  p_dibayar_oleh uuid,
  p_deskripsi text,
  p_jumlah_total bigint,
  p_jenis_split public.jenis_split,
  p_pembagian jsonb
)
returns public.pengeluaran
language plpgsql security invoker
set search_path = public
as $$
declare
  v_pengeluaran public.pengeluaran;
begin
  -- 0 baris ter-update = versi di DB sudah berubah (atau tidak punya akses)
  update public.pengeluaran
  set dibayar_oleh = p_dibayar_oleh,
      deskripsi = p_deskripsi,
      jumlah_total = p_jumlah_total,
      jenis_split = p_jenis_split
  where id = p_id and versi = p_versi_terakhir
  returning * into v_pengeluaran;

  if not found then
    raise exception 'Data pengeluaran telah diubah oleh anggota lain'
      using errcode = 'PT409';
  end if;

  delete from public.pembagian_pengeluaran where pengeluaran_id = p_id;

  insert into public.pembagian_pengeluaran (pengeluaran_id, anggota_id, jumlah_tanggungan, persentase)
  select
    p_id,
    (item->>'anggota_id')::uuid,
    (item->>'jumlah_tanggungan')::bigint,
    (item->>'persentase')::numeric
  from jsonb_array_elements(p_pembagian) as item;

  return v_pengeluaran;
end;
$$;

revoke execute on function
  public.simpan_pengeluaran(uuid, uuid, text, bigint, public.jenis_split, jsonb),
  public.edit_pengeluaran(uuid, integer, uuid, text, bigint, public.jenis_split, jsonb)
from public, anon;

grant execute on function
  public.simpan_pengeluaran(uuid, uuid, text, bigint, public.jenis_split, jsonb),
  public.edit_pengeluaran(uuid, integer, uuid, text, bigint, public.jenis_split, jsonb)
to authenticated;
