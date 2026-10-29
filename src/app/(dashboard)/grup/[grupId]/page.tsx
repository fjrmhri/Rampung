"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGrupDetail,
  useTambahAnggotaTanpaAkun,
  useHapusGrup,
} from "@/hooks/useGrup";
import {
  useDaftarPengeluaran,
  useHapusPengeluaran,
} from "@/hooks/usePengeluaran";
import { useSaldoGrup, useRealtimeSaldo } from "@/hooks/useRealtimeSaldo";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  PlusCircle,
  Receipt,
  Edit3,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  Loader2,
  Radio,
} from "lucide-react";

interface GrupDetailPageProps {
  params: Promise<{ grupId: string }>;
}

export default function GrupDetailPage({ params }: GrupDetailPageProps) {
  const { grupId } = use(params);

  // Activate Realtime Subscription per grupId
  useRealtimeSaldo(grupId);

  const router = useRouter();
  const {
    data: grup,
    isLoading: loadingGrup,
    isError,
    error,
  } = useGrupDetail(grupId);
  const { data: daftarPengeluaran, isLoading: loadingPengeluaran } =
    useDaftarPengeluaran(grupId);
  const { data: daftarSaldo, isLoading: loadingSaldo } = useSaldoGrup(grupId);

  const deleteGroup = useHapusGrup();
  const tambahTanpaAkun = useTambahAnggotaTanpaAkun();
  const hapusPengeluaran = useHapusPengeluaran();

  const [copied, setCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [namaTanpaAkun, setNamaTanpaAkun] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCopyKode = () => {
    if (!grup?.kode_undangan) return;
    navigator.clipboard.writeText(grup.kode_undangan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTambahTanpaAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTanpaAkun.trim()) return;

    try {
      await tambahTanpaAkun.mutateAsync({
        grupId,
        nama: namaTanpaAkun.trim(),
      });
      setNamaTanpaAkun("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Gagal menambah anggota tanpa akun:", err);
    }
  };

  const handleHapusPengeluaran = async (id: string) => {
    try {
      await hapusPengeluaran.mutateAsync({ id, grupId });
      setDeletingId(null);
    } catch (err) {
      console.error("Gagal menghapus pengeluaran:", err);
    }
  };

  if (loadingGrup) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !grup) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
          <h2 className="text-lg font-bold text-destructive">
            Grup Tidak Ditemukan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error?.message ||
              "Anda tidak memiliki akses ke grup ini atau grup tidak ada."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Tombol Kembali */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>

      {/* Header Detail Grup */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {grup.nama}
              </h1>
              {grup.is_admin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Dibuat pada{" "}
              {new Date(grup.dibuat_pada).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Kode Undangan
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  {grup.kode_undangan}
                </p>
              </div>
              <button
                onClick={handleCopyKode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin
                  </>
                )}
              </button>
            </div>

            {grup.is_admin && (
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive shadow-sm hover:bg-destructive/20 transition"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Grup
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Saldo Bersih (Realtime) */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Saldo Bersih Anggota
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/grup/${grupId}/settlement`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Penyelesaian Utang (Settlement)
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
              <span>Real-time Live</span>
            </div>
          </div>
        </div>

        {loadingSaldo ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !daftarSaldo || daftarSaldo.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada saldo tercatat.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daftarSaldo.map((item) => {
              const saldo = item.saldo;
              const isPiutang = saldo > 0;
              const isUtang = saldo < 0;

              return (
                <div
                  key={item.anggota_id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition ${
                    isPiutang
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isUtang
                        ? "border-rose-500/30 bg-rose-500/5"
                        : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {item.anggota?.nama_tampilan || "Anggota"}
                    </span>
                    {isPiutang && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        Piutang
                      </span>
                    )}
                    {isUtang && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <TrendingDown className="h-3 w-3" />
                        Utang
                      </span>
                    )}
                    {!isPiutang && !isUtang && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        <Scale className="h-3 w-3" />
                        Imbang
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-lg font-extrabold ${
                        isPiutang
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isUtang
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isPiutang ? "+" : ""}
                      Rp {saldo.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isPiutang
                        ? "Berhak menerima pembayaran"
                        : isUtang
                          ? "Wajib membayar"
                          : "Tidak ada tagihan/utang"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bagian Riwayat Pengeluaran */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Riwayat Pengeluaran ({daftarPengeluaran?.length || 0})
            </h2>
          </div>

          <Link
            href={`/grup/${grupId}/pengeluaran/baru`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Pengeluaran
          </Link>
        </div>

        {loadingPengeluaran ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !daftarPengeluaran || daftarPengeluaran.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada pengeluaran dicatat di grup ini.
            </p>
            <Link
              href={`/grup/${grupId}/pengeluaran/baru`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Catat pengeluaran pertama &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {daftarPengeluaran.map((item) => {
              const jenisBadgeLabel =
                item.jenis_split === "sama_rata"
                  ? "Sama Rata"
                  : item.jenis_split === "persentase"
                    ? "Persentase"
                    : "Nominal Pasti";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-background p-4 space-y-3 hover:border-primary/30 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm sm:text-base">
                          {item.deskripsi}
                        </h3>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {jenisBadgeLabel}
                        </span>
                        <span
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                          title="Versi data (Optimistic Locking)"
                        >
                          v{item.versi}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dibayar oleh{" "}
                        <strong className="text-foreground font-medium">
                          {item.pembayar?.nama_tampilan || "Anggota"}
                        </strong>{" "}
                        •{" "}
                        {new Date(item.dibuat_pada).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <span className="text-base font-bold text-foreground">
                        Rp {item.jumlah_total.toLocaleString("id-ID")}
                      </span>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/grup/${grupId}/pengeluaran/${item.id}/edit`}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition"
                          title="Edit Pengeluaran"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Pembagian */}
                  {item.pembagian && item.pembagian.length > 0 && (
                    <div className="pt-2 border-t border-border/50 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {item.pembagian.map((p) => (
                        <div
                          key={p.id || p.anggota_id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5"
                        >
                          <span className="text-muted-foreground truncate mr-2">
                            {p.anggota?.nama_tampilan || "Anggota"}
                          </span>
                          <span className="font-semibold text-foreground shrink-0">
                            Rp {p.jumlah_tanggungan.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bagian Anggota Grup */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Anggota Grup ({grup.anggota.length})
            </h2>
          </div>

          {grup.is_admin && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
            >
              <Plus className="h-4 w-4" />
              Tambah Anggota Tanpa Akun
            </button>
          )}
        </div>

        {/* Form Tambah Anggota Tanpa Akun */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Tambah Anggota (Tanpa Akun)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Anggota ini tidak perlu login. Berguna untuk mencatat orang yang
              belum memiliki akun.
            </p>

            {tambahTanpaAkun.isError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {tambahTanpaAkun.error.message}
              </div>
            )}

            <form
              onSubmit={handleTambahTanpaAkun}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                required
                value={namaTanpaAkun}
                onChange={(e) => setNamaTanpaAkun(e.target.value)}
                placeholder="Nama Anggota (misal: Budi)"
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={tambahTanpaAkun.isPending || !namaTanpaAkun.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
                >
                  {tambahTanpaAkun.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Simpan"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNamaTanpaAkun("");
                  }}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Anggota */}
        <div className="divide-y divide-border">
          {grup.anggota.map((member) => {
            const isOwner = member.user_id === grup.dibuat_oleh;
            const hasAccount = member.user_id !== null;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                      hasAccount
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {member.nama_tampilan.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.nama_tampilan}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Bergabung{" "}
                      {new Date(member.bergabung_pada).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Pemilik
                    </span>
                  )}
                  {hasAccount ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title="Anggota Terdaftar (Berakun)"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="hidden sm:inline">Berakun</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title="Anggota Ditambahkan Manual (Tanpa Akun)"
                    >
                      <UserX className="h-3.5 w-3.5 text-amber-500" />
                      <span className="hidden sm:inline">Tanpa Akun</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              Hapus Pengeluaran?
            </h3>
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus catatan pengeluaran ini?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={hapusPengeluaran.isPending}
                onClick={() => handleHapusPengeluaran(deletingId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow hover:opacity-90 disabled:opacity-50"
              >
                {hapusPengeluaran.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Grup */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Hapus Grup?</h3>
            <p className="text-sm text-muted-foreground">
              Menghapus grup akan menghapus semua data grup secara permanen,
              termasuk anggota, pengeluaran, dan riwayat settlement.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteGroup.isPending}
                onClick={async () => {
                  if (!grupId) return;
                  try {
                    await deleteGroup.mutateAsync(grupId);
                    router.push("/dashboard");
                  } catch (err) {
                    console.error("Gagal menghapus grup:", err);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow hover:opacity-90 disabled:opacity-50"
              >
                {deleteGroup.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Hapus Grup"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
