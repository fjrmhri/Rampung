import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  Pengeluaran,
  InputPembagian,
  InputTambahPengeluaran,
  InputEditPengeluaran,
} from "@/types/pengeluaran";

export class VersiConflictError extends Error {
  constructor() {
    super("Data pengeluaran telah diubah oleh anggota lain. Silakan muat ulang untuk mendapatkan versi terbaru.");
    this.name = "VersiConflictError";
  }
}

/**
 * Hook untuk mengambil daftar pengeluaran dalam suatu grup.
 */
export function useDaftarPengeluaran(grupId: string) {
  const supabase = createClient();

  return useQuery<Pengeluaran[]>({
    queryKey: ["pengeluaran", "daftar", grupId],
    queryFn: async () => {
      if (!grupId) return [];

      const { data, error } = await supabase
        .from("pengeluaran")
        .select(`
          *,
          pembayar:anggota_grup!pengeluaran_dibayar_oleh_fkey (
            id,
            nama_tampilan
          ),
          pembagian:pembagian_pengeluaran (
            id,
            anggota_id,
            jumlah_tanggungan,
            persentase,
            anggota:anggota_grup (
              id,
              nama_tampilan,
              user_id
            )
          )
        `)
        .eq("grup_id", grupId)
        .order("dibuat_pada", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as unknown as Pengeluaran[]) || [];
    },
    enabled: Boolean(grupId),
  });
}

/**
 * Hook untuk mengambil detail 1 pengeluaran.
 */
export function usePengeluaranDetail(pengeluaranId: string) {
  const supabase = createClient();

  return useQuery<Pengeluaran>({
    queryKey: ["pengeluaran", pengeluaranId],
    queryFn: async () => {
      if (!pengeluaranId) throw new Error("ID Pengeluaran diperlukan");

      const { data, error } = await supabase
        .from("pengeluaran")
        .select(`
          *,
          pembayar:anggota_grup!pengeluaran_dibayar_oleh_fkey (
            id,
            nama_tampilan
          ),
          pembagian:pembagian_pengeluaran (
            id,
            anggota_id,
            jumlah_tanggungan,
            persentase,
            anggota:anggota_grup (
              id,
              nama_tampilan,
              user_id
            )
          )
        `)
        .eq("id", pengeluaranId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Pengeluaran;
    },
    enabled: Boolean(pengeluaranId),
  });
}

function pembagianKeJson(pembagian: InputPembagian[]) {
  return pembagian.map((item) => ({
    anggota_id: item.anggota_id,
    jumlah_tanggungan: item.jumlah_tanggungan,
    persentase: item.persentase ?? null,
  }));
}

/**
 * Hook untuk menambah pengeluaran baru beserta pembagiannya
 * secara atomik via RPC `simpan_pengeluaran`.
 */
export function useTambahPengeluaran() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: InputTambahPengeluaran) => {
      const { data, error } = await supabase.rpc("simpan_pengeluaran", {
        p_grup_id: input.grup_id,
        p_dibayar_oleh: input.dibayar_oleh,
        p_deskripsi: input.deskripsi.trim(),
        p_jumlah_total: input.jumlah_total,
        p_jenis_split: input.jenis_split,
        p_pembagian: pembagianKeJson(input.pembagian),
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Pengeluaran;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["pengeluaran", "daftar", data.grup_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["saldo", data.grup_id],
      });
    },
  });
}

/**
 * Hook untuk mengedit pengeluaran secara atomik via RPC `edit_pengeluaran`
 * dengan Optimistic Locking (versi_terakhir).
 */
export function useEditPengeluaran() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: InputEditPengeluaran) => {
      const { data, error } = await supabase.rpc("edit_pengeluaran", {
        p_id: input.id,
        p_versi_terakhir: input.versi_terakhir,
        p_dibayar_oleh: input.dibayar_oleh,
        p_deskripsi: input.deskripsi.trim(),
        p_jumlah_total: input.jumlah_total,
        p_jenis_split: input.jenis_split,
        p_pembagian: pembagianKeJson(input.pembagian),
      });

      if (error) {
        // PT409 = versi di DB sudah berubah (konflik optimistic locking)
        if (error.code === "PT409") {
          throw new VersiConflictError();
        }
        throw new Error(error.message);
      }

      return data as Pengeluaran;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["pengeluaran", "daftar", data.grup_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["pengeluaran", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["saldo", data.grup_id],
      });
    },
  });
}

/**
 * Hook untuk menghapus pengeluaran.
 */
export function useHapusPengeluaran() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      grupId,
    }: {
      id: string;
      grupId: string;
    }) => {
      const { error } = await supabase
        .from("pengeluaran")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, grupId };
    },
    onSuccess: ({ id, grupId }) => {
      queryClient.invalidateQueries({
        queryKey: ["pengeluaran", "daftar", grupId],
      });
      queryClient.invalidateQueries({
        queryKey: ["pengeluaran", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["saldo", grupId],
      });
    },
  });
}
