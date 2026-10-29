"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AnggotaGrup } from "@/types/grup";
import type { JenisSplit, Pengeluaran } from "@/types/pengeluaran";
import { hitungHasilSplit } from "@/utils/hitungHasilSplit";
import {
  useTambahPengeluaran,
  useEditPengeluaran,
  VersiConflictError,
} from "@/hooks/usePengeluaran";
import {
  Banknote,
  ChartPie,
  Users,
  CircleCheck,
  TriangleAlert,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, labelJenisSplit } from "@/utils/format";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/SegmentedControl";

const OPSI_SPLIT: SegmentedOption<JenisSplit>[] = [
  { value: "sama_rata", label: "Sama Rata", icon: Users },
  { value: "persentase", label: "Persentase (%)", icon: ChartPie },
  { value: "nominal_pasti", label: "Nominal Pasti", icon: Banknote },
];

const kartuForm = "flex flex-col p-[clamp(18px,3vw,28px)] shadow-xs";

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

  const namaPembayar =
    anggotaList.find((a) => a.id === dibayarOleh)?.nama_tampilan ?? "-";

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Banner Error */}
        {errorMessage && (
          <Alert onDismiss={() => setErrorMessage(null)}>{errorMessage}</Alert>
        )}

        <div className="flex flex-wrap items-start gap-6">
          {/* Kolom kiri: field dan pembagian */}
          <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
            {/* Form Inputs Utama */}
            <Card as="section" className={cn(kartuForm, "gap-5")}>
              <Field label="Deskripsi Pengeluaran" htmlFor="deskripsi" required>
                <Input
                  id="deskripsi"
                  type="text"
                  required
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Makan Siang Nasi Padang, Tiket Masuk Wisata"
                />
              </Field>

              {/* Jumlah Total (Rp) & Dibayar Oleh */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
                <Field label="Jumlah Total (Rp)" htmlFor="jumlahTotal" required>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] font-bold text-muted-foreground"
                    >
                      Rp
                    </span>
                    <Input
                      id="jumlahTotal"
                      size="amount"
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
                    />
                  </div>
                </Field>

                <Field label="Dibayar Oleh" htmlFor="dibayarOleh" required>
                  <Select
                    id="dibayarOleh"
                    value={dibayarOleh}
                    onChange={(e) => setDibayarOleh(e.target.value)}
                  >
                    {anggotaList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama_tampilan}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Card>

            {/* Opsi Jenis Split */}
            <Card as="section" className={cn(kartuForm, "gap-[18px]")}>
              <p id="lbl-split" className="text-sm font-semibold">
                Pilih Jenis Pembagian (Split)
              </p>
              <SegmentedControl
                options={OPSI_SPLIT}
                value={jenisSplit}
                onChange={setJenisSplit}
                labelledBy="lbl-split"
              />

              {/* Header Pilih Anggota & Toggle All */}
              <div className="flex items-center justify-between gap-3 border-t border-muted pt-4">
                <span className="text-sm font-bold">
                  Anggota yang Ditanggung ({selectedAnggotaIds.length}/
                  {anggotaList.length})
                </span>
                <Button variant="text" onClick={toggleSelectAll}>
                  {selectedAnggotaIds.length === anggotaList.length
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </Button>
              </div>

              {/* Daftar Anggota dengan Input Sesuai Split */}
              <div className="flex flex-col gap-2">
                {anggotaList.map((anggota) => {
                  const isSelected = selectedAnggotaIds.includes(anggota.id);

                  const hasilBaris = kalkulasiHasilSplit.pembagian.find(
                    (p) => p.anggota_id === anggota.id
                  );
                  const nominalBaris = formatRupiah(
                    hasilBaris?.jumlah_tanggungan || 0
                  );

                  return (
                    <div
                      key={anggota.id}
                      className={cn(
                        "flex min-h-14 flex-wrap items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 transition-colors duration-150",
                        isSelected
                          ? "border-primary/30 bg-primary-soft/45"
                          : "border-border bg-card"
                      )}
                    >
                      <label className="flex min-h-9 min-w-0 flex-[1_1_120px] cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAnggota(anggota.id)}
                          className="m-0 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                        />
                        <span
                          className={cn(
                            "truncate text-sm font-semibold",
                            !isSelected && "text-muted-foreground"
                          )}
                        >
                          {anggota.nama_tampilan}
                        </span>
                      </label>

                      {/* Render Input Khusus Jenis Split */}
                      {isSelected && jenisSplit === "sama_rata" && (
                        <span className="text-sm font-extrabold tabular-nums">
                          {nominalBaris}
                        </span>
                      )}

                      {isSelected && jenisSplit === "persentase" && (
                        <div className="flex items-center gap-2">
                          <Input
                            size="sm"
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0"
                            aria-label={`Persentase ${anggota.nama_tampilan}`}
                            className="w-[72px]"
                            value={persentaseMap[anggota.id] || ""}
                            onChange={(e) =>
                              setPersentaseMap({
                                ...persentaseMap,
                                [anggota.id]: e.target.value,
                              })
                            }
                          />
                          <span className="text-[13px] text-muted-foreground">%</span>
                          <span className="min-w-[88px] text-right text-sm font-extrabold tabular-nums">
                            {nominalBaris}
                          </span>
                        </div>
                      )}

                      {isSelected && jenisSplit === "nominal_pasti" && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-muted-foreground">Rp</span>
                          <Input
                            size="sm"
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            aria-label={`Nominal ${anggota.nama_tampilan}`}
                            className="w-32"
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
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Kolom kanan: ringkasan sticky */}
          <aside className="sticky top-[88px] flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-summary">
            <div className="flex flex-col gap-1">
              <p className="text-[13px] font-semibold text-muted-foreground">
                Jumlah Total (Rp)
              </p>
              <p className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] tabular-nums">
                {formatRupiah(jumlahTotal)}
              </p>
            </div>

            <dl className="flex flex-col gap-2 border-y border-muted py-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Dibayar Oleh</dt>
                <dd className="truncate text-right font-bold">{namaPembayar}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Jenis Pembagian</dt>
                <dd className="font-bold">{labelJenisSplit(jenisSplit)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Anggota yang Ditanggung</dt>
                <dd className="font-bold tabular-nums">
                  {selectedAnggotaIds.length}/{anggotaList.length}
                </dd>
              </div>
            </dl>

            {/* Status Validasi Pembagian */}
            <div aria-live="polite">
              {kalkulasiHasilSplit.isValid ? (
                <div className="flex items-start gap-2 rounded-md bg-positive-soft px-3 py-2.5 text-[13px] font-semibold text-positive">
                  <CircleCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
                  <span>Pembagian valid &amp; total tanggungan sesuai.</span>
                </div>
              ) : (
                kalkulasiHasilSplit.errorText && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-[13px] font-semibold text-destructive-fg-soft">
                    <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
                    <span>{kalkulasiHasilSplit.errorText}</span>
                  </div>
                )
              )}
            </div>

            {/* Submit Button */}
            <Button
              id="btn-submit-pengeluaran"
              type="submit"
              size="xl"
              fullWidth
              loading={isPending}
              disabled={!kalkulasiHasilSplit.isValid}
            >
              {isPending
                ? "Menyimpan Pengeluaran..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Tambah Pengeluaran"}
            </Button>
          </aside>
        </div>
      </form>

      {/* Dialog Konflik Optimistic Locking */}
      <Dialog
        open={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        title="Konflik Versi Data"
        icon={TriangleAlert}
        tone="destructive"
        description="Data pengeluaran ini telah diubah oleh anggota lain saat Anda sedang mengeditnya. Perubahan Anda tidak disimpan untuk mencegah data tertimpa."
        actions={
          <Button
            onClick={() => {
              setConflictDialogOpen(false);
              window.location.reload();
            }}
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Muat Ulang Data Terbaru
          </Button>
        }
      />
    </div>
  );
}
