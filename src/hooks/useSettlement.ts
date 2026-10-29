import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TransaksiPelunasanDB } from "@/types/settlement";

/**
 * Hook untuk mengambil riwayat transaksi pelunasan dalam grup.
 */
export function useDaftarPelunasan(grupId: string) {
  const supabase = createClient();

  return useQuery<TransaksiPelunasanDB[]>({
    queryKey: ["pelunasan", grupId],
    queryFn: async () => {
      if (!grupId) return [];

      const { data, error } = await supabase
        .from("transaksi_pelunasan")
        .select(
          `
          *,
          dari_anggota:anggota_grup!transaksi_pelunasan_dari_anggota_id_fkey (
            id,
            nama_tampilan
          ),
          ke_anggota:anggota_grup!transaksi_pelunasan_ke_anggota_id_fkey (
            id,
            nama_tampilan
          )
        `,
        )
        .eq("grup_id", grupId)
        .eq("status", "lunas")
        .order("dibuat_pada", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data as unknown as TransaksiPelunasanDB[]) || [];
    },
    enabled: Boolean(grupId),
  });
}

/**
 * Hook untuk menandai pelunasan (insert transaksi_pelunasan dengan status='lunas', lunas_pada=now()).
 */
export function useTandaiLunas() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      grupId,
      dariAnggotaId,
      keAnggotaId,
      jumlah,
    }: {
      grupId: string;
      dariAnggotaId: string;
      keAnggotaId: string;
      jumlah: number;
    }) => {
      // Cek apakah ada transaksi pelunasan pending yang cocok untuk diubah menjadi lunas.
      const { data: existingPending, error: selectError } = await supabase
        .from("transaksi_pelunasan")
        .select("id")
        .eq("grup_id", grupId)
        .eq("dari_anggota_id", dariAnggotaId)
        .eq("ke_anggota_id", keAnggotaId)
        .eq("status", "pending")
        .order("dibuat_pada", { ascending: false })
        .limit(1);

      if (selectError) {
        throw new Error(selectError.message);
      }

      if (existingPending && existingPending.length > 0) {
        const { data, error } = await supabase
          .from("transaksi_pelunasan")
          .update({
            jumlah,
            status: "lunas",
            lunas_pada: new Date().toISOString(),
          })
          .eq("id", existingPending[0].id)
          .select("*")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data as TransaksiPelunasanDB;
      }

      const { data, error } = await supabase
        .from("transaksi_pelunasan")
        .insert({
          grup_id: grupId,
          dari_anggota_id: dariAnggotaId,
          ke_anggota_id: keAnggotaId,
          jumlah: jumlah,
          status: "lunas",
          lunas_pada: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as TransaksiPelunasanDB;
    },
    onSuccess: (_, { grupId }) => {
      // Refresh saldo bersih & riwayat transaksi pelunasan
      queryClient.invalidateQueries({ queryKey: ["saldo", grupId] });
      queryClient.invalidateQueries({ queryKey: ["pelunasan", grupId] });
    },
  });
}
