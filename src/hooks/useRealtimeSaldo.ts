import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SaldoAnggota } from "@/types/saldo";

/**
 * Hook untuk mengambil saldo bersih per anggota grup dari view `saldo_bersih`.
 */
export function useSaldoGrup(grupId: string) {
  const supabase = createClient();

  return useQuery<SaldoAnggota[]>({
    queryKey: ["saldo", grupId],
    queryFn: async () => {
      if (!grupId) return [];

      // 1. Ambil data dari view saldo_bersih
      const { data: saldoData, error: saldoError } = await supabase
        .from("saldo_bersih")
        .select("*")
        .eq("grup_id", grupId);

      if (saldoError) {
        throw new Error(saldoError.message);
      }

      // 2. Ambil data anggota_grup untuk nama_tampilan
      const { data: anggotaData, error: anggotaError } = await supabase
        .from("anggota_grup")
        .select("id, nama_tampilan, user_id")
        .eq("grup_id", grupId);

      if (anggotaError) {
        throw new Error(anggotaError.message);
      }

      const anggotaMap = new Map((anggotaData || []).map((a) => [a.id, a]));

      return (saldoData || []).map((item) => ({
        anggota_id: item.anggota_id,
        grup_id: item.grup_id,
        saldo: Number(item.saldo),
        anggota: anggotaMap.get(item.anggota_id),
      }));
    },
    enabled: Boolean(grupId),
  });
}

/**
 * Hook untuk memantau perubahan Supabase Realtime di tabel:
 * - pengeluaran
 * - pembagian_pengeluaran
 * - transaksi_pelunasan
 * - anggota_grup
 *
 * Meng-invalidate query cache `['saldo', grupId]` & `['pengeluaran', 'daftar', grupId]` secara otomatis saat event masuk.
 */
export function useRealtimeSaldo(grupId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!grupId) return;

    const channel = supabase
      .channel(`realtime-saldo-${grupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pengeluaran",
          filter: `grup_id=eq.${grupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["saldo", grupId] });
          queryClient.invalidateQueries({
            queryKey: ["pengeluaran", "daftar", grupId],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pembagian_pengeluaran",
          // Tanpa filter: tabel ini tidak punya grup_id, dan event DELETE
          // (termasuk cascade dari hapus pengeluaran) memang tidak bisa difilter.
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["saldo", grupId] });
          queryClient.invalidateQueries({
            queryKey: ["pengeluaran", "daftar", grupId],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaksi_pelunasan",
          filter: `grup_id=eq.${grupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["saldo", grupId] });
          queryClient.invalidateQueries({ queryKey: ["pelunasan", grupId] });
          queryClient.invalidateQueries({
            queryKey: ["pengeluaran", "daftar", grupId],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anggota_grup",
          filter: `grup_id=eq.${grupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["saldo", grupId] });
          queryClient.invalidateQueries({ queryKey: ["grup", grupId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [grupId, queryClient, supabase]);
}
