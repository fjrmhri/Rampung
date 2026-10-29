import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";

/**
 * Menguji view `saldo_bersih` dari migrasi asli di Postgres in-memory (PGlite).
 * Skema `auth`, role, dan publikasi Realtime milik Supabase diganti stub minimal.
 */

const MIGRASI = [
  "0001_init.sql",
  "0002_tambah_anggota_tanpa_akun.sql",
  "0003_hardening_rls.sql",
  "0004_rpc_pengeluaran.sql",
  "0005_perbaiki_tanda_pelunasan.sql",
];

const STUB_SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  create publication supabase_realtime;
`;

const USER_A = "00000000-0000-0000-0000-00000000000a";
const USER_B = "00000000-0000-0000-0000-00000000000b";
const USER_LUAR = "00000000-0000-0000-0000-0000000000ff";

let db: PGlite;
let grupId: string;
let anggota: Record<string, string>;

async function sebagai<T>(userId: string, kerja: () => Promise<T>) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try {
    return await kerja();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUB_SUPABASE);
  for (const file of MIGRASI) {
    await db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
  }

  await db.exec(`
    insert into auth.users (id, email) values
      ('${USER_A}', 'a@contoh.com'),
      ('${USER_B}', 'b@contoh.com'),
      ('${USER_LUAR}', 'luar@contoh.com');
  `);

  const grup = await db.query<{ id: string }>(
    `insert into public.grup (nama, dibuat_oleh) values ('Liburan', '${USER_A}') returning id`,
  );
  grupId = grup.rows[0].id;

  // Pemilik (A) otomatis jadi anggota lewat trigger; B dan C ditambahkan manual
  await db.exec(`
    insert into public.anggota_grup (grup_id, user_id, nama_tampilan) values
      ('${grupId}', '${USER_B}', 'B'),
      ('${grupId}', null, 'C');
  `);
  const rows = await db.query<{ id: string; nama_tampilan: string }>(
    `select id, nama_tampilan from public.anggota_grup where grup_id = '${grupId}'`,
  );
  anggota = Object.fromEntries(
    rows.rows.map((r) => [r.nama_tampilan === "a@contoh.com" ? "A" : r.nama_tampilan, r.id]),
  );

  // A membayar dua kali dan juga ikut menanggung keduanya (kasus fan-out)
  const p1 = await db.query<{ id: string }>(
    `insert into public.pengeluaran (grup_id, dibayar_oleh, deskripsi, jumlah_total)
     values ('${grupId}', '${anggota.A}', 'Makan', 90000) returning id`,
  );
  const p2 = await db.query<{ id: string }>(
    `insert into public.pengeluaran (grup_id, dibayar_oleh, deskripsi, jumlah_total)
     values ('${grupId}', '${anggota.A}', 'Bensin', 60000) returning id`,
  );
  await db.exec(`
    insert into public.pembagian_pengeluaran (pengeluaran_id, anggota_id, jumlah_tanggungan) values
      ('${p1.rows[0].id}', '${anggota.A}', 30000),
      ('${p1.rows[0].id}', '${anggota.B}', 30000),
      ('${p1.rows[0].id}', '${anggota.C}', 30000),
      ('${p2.rows[0].id}', '${anggota.A}', 20000),
      ('${p2.rows[0].id}', '${anggota.B}', 20000),
      ('${p2.rows[0].id}', '${anggota.C}', 20000);
    insert into public.transaksi_pelunasan (grup_id, dari_anggota_id, ke_anggota_id, jumlah, status)
      values ('${grupId}', '${anggota.B}', '${anggota.A}', 10000, 'lunas'),
             ('${grupId}', '${anggota.C}', '${anggota.A}', 5000, 'pending');
  `);
});

afterAll(async () => {
  await db?.close();
});

async function saldoPerAnggota() {
  const hasil = await db.query<{ anggota_id: string; saldo: string }>(
    `select anggota_id, saldo from public.saldo_bersih where grup_id = '${grupId}'`,
  );
  return Object.fromEntries(hasil.rows.map((r) => [r.anggota_id, Number(r.saldo)]));
}

describe("view saldo_bersih (SQL asli)", () => {
  it("menghitung saldo tanpa fan-out dan hanya memperhitungkan pelunasan berstatus lunas", async () => {
    const saldo = await saldoPerAnggota();
    // A: bayar 150.000 - tanggung 50.000 - terima pelunasan 10.000 = 90.000
    expect(saldo[anggota.A]).toBe(90000);
    // B: tanggung 50.000, sudah melunasi 10.000
    expect(saldo[anggota.B]).toBe(-40000);
    // C: tanggung 50.000, pelunasan masih pending sehingga belum dihitung
    expect(saldo[anggota.C]).toBe(-50000);
    expect(Object.values(saldo).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("tetap memakai security_invoker setelah view diganti migrasi 0005", async () => {
    const hasil = await db.query<{ reloptions: string[] | null }>(
      "select reloptions from pg_class where relname = 'saldo_bersih'",
    );
    expect(hasil.rows[0].reloptions).toContain("security_invoker=true");
  });

  it("menghormati RLS (security_invoker): anggota grup melihat saldo, orang luar tidak", async () => {
    const terlihatOlehB = await sebagai(USER_B, saldoPerAnggota);
    expect(Object.keys(terlihatOlehB)).toHaveLength(3);

    const terlihatOlehLuar = await sebagai(USER_LUAR, saldoPerAnggota);
    expect(Object.keys(terlihatOlehLuar)).toHaveLength(0);
  });
});
