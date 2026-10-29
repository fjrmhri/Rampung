-- ================================================================
-- RAMPUNG — Migrasi 0005 (Perbaiki tanda pelunasan di saldo_bersih)
-- `dari_anggota_id` adalah debitur yang membayar, `ke_anggota_id` adalah
-- kreditur yang menerima. Pelunasan harus MENAIKKAN saldo pembayar dan
-- MENURUNKAN saldo penerima; versi 0001 membaliknya sehingga setiap
-- "Tandai Lunas" justru memperbesar utang.
-- ================================================================

set search_path = public, pg_catalog;

create or replace view public.saldo_bersih
with (security_invoker = true) as
select
  ag.id as anggota_id,
  ag.grup_id,
  coalesce(dibayar.total, 0)
    - coalesce(ditanggung.total, 0)
    + coalesce(pelunasan_keluar.total, 0)
    - coalesce(pelunasan_masuk.total, 0) as saldo
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
