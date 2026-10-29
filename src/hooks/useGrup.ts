import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Grup, GrupDetail, AnggotaGrup } from "@/types/grup";

/**
 * Hook untuk mengambil daftar grup di mana user menjadi anggota.
 */
export function useDaftarGrup() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["grup", "daftar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grup")
        .select(
          `
          id,
          nama,
          kode_undangan,
          dibuat_oleh,
          dibuat_pada,
          anggota_grup ( id )
        `,
        )
        .order("dibuat_pada", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((g) => ({
        id: g.id,
        nama: g.nama,
        kode_undangan: g.kode_undangan,
        dibuat_oleh: g.dibuat_oleh,
        dibuat_pada: g.dibuat_pada,
        jumlah_anggota: Array.isArray(g.anggota_grup)
          ? g.anggota_grup.length
          : 0,
      }));
    },
  });
}

/**
 * Hook untuk mengambil detail grup beserta daftar anggotanya.
 */
export function useGrupDetail(grupId: string) {
  const supabase = createClient();

  return useQuery<GrupDetail>({
    queryKey: ["grup", grupId],
    queryFn: async () => {
      if (!grupId) throw new Error("ID Grup diperlukan");

      // 1. Ambil data grup
      const { data: grupData, error: grupError } = await supabase
        .from("grup")
        .select("*")
        .eq("id", grupId)
        .single();

      if (grupError) {
        throw new Error(grupError.message);
      }

      // 2. Ambil daftar anggota grup
      const { data: anggotaData, error: anggotaError } = await supabase
        .from("anggota_grup")
        .select("*")
        .eq("grup_id", grupId)
        .order("bergabung_pada", { ascending: true });

      if (anggotaError) {
        throw new Error(anggotaError.message);
      }

      // 3. Cek user aktif
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return {
        ...grupData,
        anggota: (anggotaData as AnggotaGrup[]) || [],
        is_admin: grupData.dibuat_oleh === user?.id,
      };
    },
    enabled: Boolean(grupId),
  });
}

/**
 * Hook untuk membuat grup baru.
 * Trigger `saat_grup_baru` di DB otomatis menjadikan pembuat sebagai anggota pertama.
 */
export function useBuatGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nama,
      namaPemilik,
    }: {
      nama: string;
      namaPemilik?: string;
    }) => {
      const response = await fetch("/api/grup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          nama: nama.trim(),
          nama_pemilik: namaPemilik?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat grup");
      }

      return data as Grup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grup", "daftar"] });
    },
  });
}

/**
 * Hook untuk bergabung ke grup menggunakan RPC `gabung_grup`.
 */
export function useGabungGrup() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ kode, nama }: { kode: string; nama?: string }) => {
      const { data, error } = await supabase.rpc("gabung_grup", {
        kode: kode.trim(),
        nama: nama?.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      // RPC mengembalikan uuid target_grup_id
      return data as string;
    },
    onSuccess: (grupId) => {
      queryClient.invalidateQueries({ queryKey: ["grup", "daftar"] });
      queryClient.invalidateQueries({ queryKey: ["grup", grupId] });
    },
  });
}

/**
 * Hook untuk menambah anggota tanpa akun via RPC `tambah_anggota_tanpa_akun`.
 */
export function useTambahAnggotaTanpaAkun() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ grupId, nama }: { grupId: string; nama: string }) => {
      const { data, error } = await supabase.rpc("tambah_anggota_tanpa_akun", {
        p_grup_id: grupId,
        p_nama: nama.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as string; // returns anggota_id
    },
    onSuccess: (_, { grupId }) => {
      queryClient.invalidateQueries({ queryKey: ["grup", grupId] });
      queryClient.invalidateQueries({ queryKey: ["grup", "daftar"] });
    },
  });
}

/**
 * Hook untuk menghapus grup oleh admin/pemilik.
 */
export function useHapusGrup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grupId: string) => {
      const response = await fetch(`/api/grup/${encodeURIComponent(grupId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus grup");
      }

      return data as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grup", "daftar"] });
    },
  });
}
