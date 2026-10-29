"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AnggotaGrup } from "@/types/grup";
import type {
  JenisSplit,
  Pengeluaran,
  InputPembagian,
} from "@/types/pengeluaran";
import {
  useTambahPengeluaran,
  useEditPengeluaran,
  VersiConflictError,
} from "@/hooks/usePengeluaran";
import {
  DollarSign,
  PieChart,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

interface HasilSplit {
  isValid: boolean;
  errorText?: string;
  pembagian: InputPembagian[];
}

// Kalkulasi Split berdasarkan jenis_split
function hitungHasilSplit(
  selectedAnggotaIds: string[],
  jumlahTotal: number,
  jenisSplit: JenisSplit,
  persentaseMap: Record<string, string>,
  nominalMap: Record<string, string>,
): HasilSplit {
  if (selectedAnggotaIds.length === 0) {
    return {
      isValid: false,
      errorText: "Pilih minimal 1 anggota untuk membagi pengeluaran",
      pembagian: [],
    };
  }

  if (jumlahTotal <= 0) {
    return {
      isValid: false,
      errorText: "Jumlah total harus lebih dari 0",
      pembagian: [],
    };
  }

  if (jenisSplit === "sama_rata") {
    const count = selectedAnggotaIds.length;
    const baseShare = Math.floor(jumlahTotal / count);
    let remainder = jumlahTotal - baseShare * count;

    const pembagian: InputPembagian[] = selectedAnggotaIds.map((anggotaId) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return {
        anggota_id: anggotaId,
        jumlah_tanggungan: share,
      };
    });

    return { isValid: true, pembagian };
  }

  if (jenisSplit === "persentase") {
    let totalPersentase = 0;
    const tempItems: { anggotaId: string; pct: number }[] = [];

    for (const id of selectedAnggotaIds) {
      const valStr = persentaseMap[id] || "0";
      const pct = parseFloat(valStr);
      if (isNaN(pct) || pct < 0) {
        return {
          isValid: false,
          errorText: "Persentase tidak boleh negatif atau kosong",
          pembagian: [],
        };
      }
      totalPersentase += pct;
      tempItems.push({ anggotaId: id, pct });
    }

    if (Math.abs(totalPersentase - 100) > 0.01) {
      return {
        isValid: false,
        errorText: `Total persentase harus 100% (saat ini: ${totalPersentase.toFixed(1)}%)`,
        pembagian: [],
      };
    }

    let totalCalculated = 0;
    const pembagian: InputPembagian[] = tempItems.map((item, idx) => {
      let tanggungan = Math.round((item.pct / 100) * jumlahTotal);
      if (idx === tempItems.length - 1) {
        // Penyesuaian rounding untuk anggota terakhir agar pas jumlahTotal
        tanggungan = jumlahTotal - totalCalculated;
      } else {
        totalCalculated += tanggungan;
      }
      return {
        anggota_id: item.anggotaId,
        jumlah_tanggungan: tanggungan,
        persentase: item.pct,
      };
    });

    return { isValid: true, pembagian };
  }

  if (jenisSplit === "nominal_pasti") {
    let totalNominal = 0;
    const pembagian: InputPembagian[] = [];

    for (const id of selectedAnggotaIds) {
      const valStr = nominalMap[id] || "0";
      const nominal = parseInt(valStr.replace(/\D/g, ""), 10) || 0;
      if (nominal < 0) {
        return {
          isValid: false,
          errorText: "Nominal tidak boleh negatif",
          pembagian: [],
        };
      }
      totalNominal += nominal;
      pembagian.push({
        anggota_id: id,
        jumlah_tanggungan: nominal,
      });
    }

    if (totalNominal !== jumlahTotal) {
      const selisih = jumlahTotal - totalNominal;
      return {
        isValid: false,
        errorText: `Total nominal (Rp ${totalNominal.toLocaleString(
          "id-ID"
        )}) ${selisih > 0 ? "kurang" : "lebih"} Rp ${Math.abs(
          selisih
        ).toLocaleString("id-ID")} dari Jumlah Total (Rp ${jumlahTotal.toLocaleString(
          "id-ID"
        )})`,
        pembagian: [],
      };
    }

    return { isValid: true, pembagian };
  }

  return { isValid: false, errorText: "Jenis split tidak valid", pembagian: [] };
}

interface FormPengeluaranProps {
  grupId: string;
  anggotaList: AnggotaGrup[];
  pengeluaranToEdit?: Pengeluaran;
  onSuccess?: () => void;
}

export function FormPengeluaran({
  grupId,
  anggotaList,
  pengeluaranToEdit,
  onSuccess,
}: FormPengeluaranProps) {
  const router = useRouter();
  const isEditing = Boolean(pengeluaranToEdit);

  // Form States
  const [deskripsi, setDeskripsi] = useState(
    pengeluaranToEdit?.deskripsi || ""
  );
  const [jumlahTotalStr, setJumlahTotalStr] = useState(
    pengeluaranToEdit?.jumlah_total ? String(pengeluaranToEdit.jumlah_total) : ""
  );
  const [dibayarOleh, setDibayarOleh] = useState(
    pengeluaranToEdit?.dibayar_oleh || (anggotaList[0]?.id ?? "")
  );
  const [jenisSplit, setJenisSplit] = useState<JenisSplit>(
    pengeluaranToEdit?.jenis_split || "sama_rata"
  );

  // State Pilihan Anggota & Custom Inputs (persentase / nominal)
  const [selectedAnggotaIds, setSelectedAnggotaIds] = useState<string[]>(() => {
    if (pengeluaranToEdit?.pembagian?.length) {
      return pengeluaranToEdit.pembagian.map((p) => p.anggota_id);
    }
    return anggotaList.map((a) => a.id);
  });

  const [persentaseMap, setPersentaseMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (pengeluaranToEdit?.pembagian?.length) {
      pengeluaranToEdit.pembagian.forEach((p) => {
        if (p.persentase !== undefined && p.persentase !== null) {
          map[p.anggota_id] = String(p.persentase);
        }
      });
    }
    return map;
  });

  const [nominalMap, setNominalMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (pengeluaranToEdit?.pembagian?.length) {
      pengeluaranToEdit.pembagian.forEach((p) => {
        map[p.anggota_id] = String(p.jumlah_tanggungan);
      });
    }
    return map;
  });

  // State Konflik & Error
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tambahPengeluaran = useTambahPengeluaran();
  const editPengeluaran = useEditPengeluaran();

  const isPending = tambahPengeluaran.isPending || editPengeluaran.isPending;

  const jumlahTotal = useMemo(() => {
    const parsed = parseInt(jumlahTotalStr.replace(/\D/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [jumlahTotalStr]);

  // Handler Pilih / Unpilih Semua Anggota
  const toggleSelectAll = () => {
    if (selectedAnggotaIds.length === anggotaList.length) {
      setSelectedAnggotaIds([]);
    } else {
      setSelectedAnggotaIds(anggotaList.map((a) => a.id));
    }
  };

  const toggleSelectAnggota = (id: string) => {
    if (selectedAnggotaIds.includes(id)) {
      setSelectedAnggotaIds(selectedAnggotaIds.filter((item) => item !== id));
    } else {
      setSelectedAnggotaIds([...selectedAnggotaIds, id]);
    }
  };

  const kalkulasiHasilSplit = useMemo(
    () =>
      hitungHasilSplit(
        selectedAnggotaIds,
        jumlahTotal,
        jenisSplit,
        persentaseMap,
        nominalMap,
      ),
    [selectedAnggotaIds, jumlahTotal, jenisSplit, persentaseMap, nominalMap],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!deskripsi.trim()) {
      setErrorMessage("Deskripsi pengeluaran wajib diisi");
      return;
    }

    if (!dibayarOleh) {
      setErrorMessage("Pilih anggota yang membayar");
      return;
    }

    if (!kalkulasiHasilSplit.isValid) {
      setErrorMessage(
        kalkulasiHasilSplit.errorText || "Periksa kembali pembagian pengeluaran"
      );
      return;
    }

    try {
      if (isEditing && pengeluaranToEdit) {
        await editPengeluaran.mutateAsync({
          id: pengeluaranToEdit.id,
          grup_id: grupId,
          dibayar_oleh: dibayarOleh,
          deskripsi: deskripsi.trim(),
          jumlah_total: jumlahTotal,
          jenis_split: jenisSplit,
          versi_terakhir: pengeluaranToEdit.versi,
          pembagian: kalkulasiHasilSplit.pembagian,
        });
      } else {
        await tambahPengeluaran.mutateAsync({
          grup_id: grupId,
          dibayar_oleh: dibayarOleh,
          deskripsi: deskripsi.trim(),
          jumlah_total: jumlahTotal,
          jenis_split: jenisSplit,
          pembagian: kalkulasiHasilSplit.pembagian,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/grup/${grupId}`);
      }
    } catch (err: unknown) {
      if (err instanceof VersiConflictError) {
        setConflictDialogOpen(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan tidak terduga");
      }
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Error */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-destructive/70 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form Inputs Utama */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label
              htmlFor="deskripsi"
              className="block text-sm font-medium text-foreground"
            >
              Deskripsi Pengeluaran <span className="text-destructive">*</span>
            </label>
            <input
              id="deskripsi"
              type="text"
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Makan Siang Nasi Padang, Tiket Masuk Wisata"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Jumlah Total (Rp) & Dibayar Oleh */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="jumlahTotal"
                className="block text-sm font-medium text-foreground"
              >
                Jumlah Total (Rp) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-sm text-muted-foreground">
                  Rp
                </span>
                <input
                  id="jumlahTotal"
                  type="text"
                  inputMode="numeric"
                  required
                  value={
                    jumlahTotal > 0
                      ? jumlahTotal.toLocaleString("id-ID")
                      : jumlahTotalStr
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setJumlahTotalStr(raw);
                  }}
                  placeholder="0"
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-bold text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="dibayarOleh"
                className="block text-sm font-medium text-foreground"
              >
                Dibayar Oleh <span className="text-destructive">*</span>
              </label>
              <select
                id="dibayarOleh"
                value={dibayarOleh}
                onChange={(e) => setDibayarOleh(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {anggotaList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama_tampilan}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Opsi Jenis Split */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="block text-sm font-medium text-foreground mb-2">
            Pilih Jenis Pembagian (Split)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setJenisSplit("sama_rata")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                jenisSplit === "sama_rata"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              <Users className="h-4 w-4 mb-1" />
              Sama Rata
            </button>

            <button
              type="button"
              onClick={() => setJenisSplit("persentase")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                jenisSplit === "persentase"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              <PieChart className="h-4 w-4 mb-1" />
              Persentase (%)
            </button>

            <button
              type="button"
              onClick={() => setJenisSplit("nominal_pasti")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                jenisSplit === "nominal_pasti"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              <DollarSign className="h-4 w-4 mb-1" />
              Nominal Pasti
            </button>
          </div>

          {/* Header Pilih Anggota & Toggle All */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs font-semibold text-foreground">
              Anggota yang Ditanggung ({selectedAnggotaIds.length}/{anggotaList.length})
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {selectedAnggotaIds.length === anggotaList.length
                ? "Batal Pilih Semua"
                : "Pilih Semua"}
            </button>
          </div>

          {/* Daftar Anggota dengan Input Sesuai Split */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {anggotaList.map((anggota) => {
              const isSelected = selectedAnggotaIds.includes(anggota.id);

              const hasilBaris = kalkulasiHasilSplit.pembagian.find(
                (p) => p.anggota_id === anggota.id
              );

              return (
                <div
                  key={anggota.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-background opacity-60"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectAnggota(anggota.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {anggota.nama_tampilan}
                    </span>
                  </label>

                  {/* Render Input Khusus Jenis Split */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {jenisSplit === "sama_rata" && (
                        <span className="text-xs font-bold text-foreground">
                          Rp {(hasilBaris?.jumlah_tanggungan || 0).toLocaleString("id-ID")}
                        </span>
                      )}

                      {jenisSplit === "persentase" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0"
                            value={persentaseMap[anggota.id] || ""}
                            onChange={(e) =>
                              setPersentaseMap({
                                ...persentaseMap,
                                [anggota.id]: e.target.value,
                              })
                            }
                            className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-right text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                          <span className="text-xs font-bold text-foreground min-w-[70px] text-right">
                            Rp {(hasilBaris?.jumlah_tanggungan || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                      {jenisSplit === "nominal_pasti" && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={
                              nominalMap[anggota.id]
                                ? parseInt(
                                    nominalMap[anggota.id].replace(/\D/g, ""),
                                    10
                                  ).toLocaleString("id-ID")
                                : ""
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setNominalMap({
                                ...nominalMap,
                                [anggota.id]: raw,
                              });
                            }}
                            className="w-28 rounded-lg border border-input bg-background px-2 py-1 text-right text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Validasi Pembagian */}
          {!kalkulasiHasilSplit.isValid && kalkulasiHasilSplit.errorText && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{kalkulasiHasilSplit.errorText}</span>
            </div>
          )}

          {kalkulasiHasilSplit.isValid && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Pembagian valid &amp; total tanggungan sesuai.</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          id="btn-submit-pengeluaran"
          type="submit"
          disabled={isPending || !kalkulasiHasilSplit.isValid}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 active:opacity-80 disabled:opacity-50 transition"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan Pengeluaran...
            </>
          ) : isEditing ? (
            "Simpan Perubahan"
          ) : (
            "Tambah Pengeluaran"
          )}
        </button>
      </form>

      {/* Dialog Konflik Optimistic Locking */}
      {conflictDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Konflik Versi Data</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Data pengeluaran ini telah diubah oleh anggota lain saat Anda sedang mengeditnya. Perubahan Anda tidak disimpan untuk mencegah data tertimpa.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictDialogOpen(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConflictDialogOpen(false);
                  router.refresh();
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Muat Ulang Data Terbaru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
