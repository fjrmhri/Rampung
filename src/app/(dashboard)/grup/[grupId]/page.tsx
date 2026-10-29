"use client";

import { use, useState, useSyncExternalStore } from "react";
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
  ArrowRight,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Copy,
  Link as LinkIcon,
  Plus,
  CirclePlus,
  Receipt,
  PenLine,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah, formatSaldo, labelJenisSplit } from "@/utils/format";
import { Alert } from "@/components/ui/Alert";
import { BackLink } from "@/components/ui/BackLink";
import { Badge, LiveBadge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface GrupDetailPageProps {
  params: Promise<{ grupId: string }>;
}

const STATUS_SALDO: Record<
  "piutang" | "utang" | "imbang",
  { tile: string; warna: string; icon: LucideIcon; label: string; caption: string }
> = {
  piutang: {
    tile: "border-positive-border bg-positive-soft",
    warna: "text-positive",
    icon: TrendingUp,
    label: "Piutang",
    caption: "Berhak menerima pembayaran",
  },
  utang: {
    tile: "border-negative-border bg-negative-soft",
    warna: "text-negative",
    icon: TrendingDown,
    label: "Utang",
    caption: "Wajib membayar",
  },
  imbang: {
    tile: "border-border bg-card",
    warna: "text-muted-foreground",
    icon: Scale,
    label: "Imbang",
    caption: "Tidak ada tagihan/utang",
  },
};

const kartuUtama =
  "flex flex-col gap-5 p-[clamp(18px,3vw,28px)] shadow-xs";

// Origin hanya ada di browser; di server dikembalikan string kosong.
const subscribeNoop = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

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

  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin);

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [namaTanpaAkun, setNamaTanpaAkun] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const linkUndangan = grup
    ? `${origin}/grup/gabung?kode=${grup.kode_undangan}`
    : "";

  const handleCopyKode = () => {
    if (!grup?.kode_undangan) return;
    navigator.clipboard.writeText(grup.kode_undangan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!grup?.kode_undangan) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/grup/gabung?kode=${grup.kode_undangan}`,
    );
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
      <div className="flex min-h-[60vh] items-center justify-center text-primary">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !grup) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="rounded-xl border border-destructive-border bg-destructive-soft p-8">
          <h2 className="text-lg font-extrabold text-destructive-fg-soft">
            Grup Tidak Ditemukan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error?.message ||
              "Anda tidak memiliki akses ke grup ini atau grup tidak ada."}
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/dashboard">Kembali ke Dashboard</BackLink>

      {/* Header Detail Grup */}
      <div className="flex flex-wrap items-end justify-between gap-5 pb-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(26px,3.2vw,34px)] leading-[1.1] font-extrabold tracking-[-0.03em] break-words">
              {grup.nama}
            </h1>
            {grup.is_admin && (
              <Badge shape="pill">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Dibuat pada{" "}
            {new Date(grup.dibuat_pada).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/grup/${grupId}/settlement`}
            className={buttonVariants({ variant: "accent" })}
          >
            <Sparkles aria-hidden="true" className="size-4" />
            Penyelesaian Utang (Settlement)
          </Link>
          <Link
            href={`/grup/${grupId}/pengeluaran/baru`}
            className={buttonVariants()}
          >
            <CirclePlus aria-hidden="true" className="size-4" />
            Tambah Pengeluaran
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* Kolom utama */}
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          {/* Ringkasan Saldo Bersih (Realtime) */}
          <Card as="section" aria-labelledby="judul-saldo" className={kartuUtama}>
            <CardTitle
              id="judul-saldo"
              icon={Wallet}
              action={<LiveBadge>Real-time Live</LiveBadge>}
            >
              Saldo Bersih Anggota
            </CardTitle>

            {loadingSaldo ? (
              <div className="flex justify-center py-6 text-muted-foreground">
                <Spinner className="size-6" />
              </div>
            ) : !daftarSaldo || daftarSaldo.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Belum ada saldo tercatat.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
                {daftarSaldo.map((item) => {
                  const saldo = item.saldo;
                  const status =
                    STATUS_SALDO[
                      saldo > 0 ? "piutang" : saldo < 0 ? "utang" : "imbang"
                    ];
                  const IkonStatus = status.icon;

                  return (
                    <div
                      key={item.anggota_id}
                      className={cn(
                        "flex flex-col gap-2.5 rounded-lg border p-4",
                        status.tile,
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold">
                          {item.anggota?.nama_tampilan || "Anggota"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 text-xs font-bold",
                            status.warna,
                          )}
                        >
                          <IkonStatus aria-hidden="true" className="size-[13px]" />
                          {status.label}
                        </span>
                      </div>

                      <div>
                        <p
                          className={cn(
                            "text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] tabular-nums",
                            status.warna,
                          )}
                        >
                          {formatSaldo(saldo)}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {status.caption}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Bagian Riwayat Pengeluaran */}
          <Card as="section" aria-labelledby="judul-riwayat" className={kartuUtama}>
            <CardTitle id="judul-riwayat" icon={Receipt}>
              Riwayat Pengeluaran ({daftarPengeluaran?.length || 0})
            </CardTitle>

            {loadingPengeluaran ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Spinner className="size-6" />
              </div>
            ) : !daftarPengeluaran || daftarPengeluaran.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-input px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada pengeluaran dicatat di grup ini.
                </p>
                <Link
                  href={`/grup/${grupId}/pengeluaran/baru`}
                  className={buttonVariants({ variant: "text" })}
                >
                  Catat pengeluaran pertama
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {daftarPengeluaran.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3.5 rounded-lg border border-border p-4 transition-colors duration-150 hover:border-input"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold break-words">
                            {item.deskripsi}
                          </h3>
                          <Badge>{labelJenisSplit(item.jenis_split)}</Badge>
                          <Badge
                            variant="version"
                            title="Versi data (Optimistic Locking)"
                            aria-label={`Versi data ${item.versi}`}
                          >
                            v{item.versi}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          Dibayar oleh{" "}
                          <strong className="font-bold text-foreground">
                            {item.pembayar?.nama_tampilan || "Anggota"}
                          </strong>{" "}
                          ·{" "}
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

                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-[17px] font-extrabold tabular-nums">
                          {formatRupiah(item.jumlah_total)}
                        </span>
                        <Link
                          href={`/grup/${grupId}/pengeluaran/${item.id}/edit`}
                          aria-label="Edit Pengeluaran"
                          title="Edit Pengeluaran"
                          className={buttonVariants({ variant: "icon" })}
                        >
                          <PenLine aria-hidden="true" className="size-[17px]" />
                        </Link>
                        <Button
                          variant="icon-danger"
                          onClick={() => setDeletingId(item.id)}
                          aria-label="Hapus Pengeluaran"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 aria-hidden="true" className="size-[17px]" />
                        </Button>
                      </div>
                    </div>

                    {/* Breakdown Pembagian */}
                    {item.pembagian && item.pembagian.length > 0 && (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))] gap-2 border-t border-dashed border-border pt-3">
                        {item.pembagian.map((p) => (
                          <div
                            key={p.id || p.anggota_id}
                            className="flex justify-between gap-2 rounded-sm bg-muted px-2.5 py-[7px] text-[13px]"
                          >
                            <span className="truncate text-muted-foreground">
                              {p.anggota?.nama_tampilan || "Anggota"}
                            </span>
                            <span className="shrink-0 font-bold tabular-nums">
                              {formatRupiah(p.jumlah_tanggungan)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Aside */}
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          {/* Kode Undangan */}
          <Card as="section" aria-labelledby="judul-kode" className="flex flex-col gap-2.5 p-5 shadow-xs">
            <h2
              id="judul-kode"
              className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase"
            >
              Kode Undangan
            </h2>
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-mono text-2xl font-bold tracking-[0.06em]">
                {grup.kode_undangan}
              </span>
              <CopyButton
                copied={copied}
                onClick={handleCopyKode}
                icon={<Copy aria-hidden="true" className="size-3.5" />}
                label="Salin"
                copiedLabel="Tersalin"
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-muted pt-3">
              <p className="text-[13px] text-muted-foreground">
                Atau bagikan tautan, kode akan terisi otomatis:
              </p>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  title={linkUndangan}
                  className="min-w-0 flex-1 truncate rounded-sm bg-muted px-2.5 py-[9px] font-mono text-xs text-info-foreground"
                >
                  {linkUndangan.replace(/^https?:\/\//, "")}
                </span>
                <CopyButton
                  variant="primary"
                  copied={linkCopied}
                  onClick={handleCopyLink}
                  icon={<LinkIcon aria-hidden="true" className="size-3.5" />}
                  label="Salin Tautan"
                  copiedLabel="Tautan tersalin"
                />
              </div>
            </div>
          </Card>

          {/* Bagian Anggota Grup */}
          <Card as="section" aria-labelledby="judul-anggota" className="flex flex-col gap-4 p-5 shadow-xs">
            <CardTitle id="judul-anggota" icon={Users}>
              Anggota Grup ({grup.anggota.length})
            </CardTitle>

            {grup.is_admin && !showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-dashed border-primary/50 bg-primary-soft/50 px-3.5 text-sm font-bold text-primary-hover transition-colors duration-150 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Plus aria-hidden="true" className="size-4" />
                Tambah Anggota Tanpa Akun
              </button>
            )}

            {/* Form Tambah Anggota Tanpa Akun */}
            {showAddForm && (
              <div className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary-soft/50 p-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold">Tambah Anggota (Tanpa Akun)</h3>
                  <p className="text-[13px] text-pretty text-info-foreground">
                    Anggota ini tidak perlu login. Berguna untuk mencatat orang
                    yang belum memiliki akun.
                  </p>
                </div>

                {tambahTanpaAkun.isError && (
                  <Alert>{tambahTanpaAkun.error.message}</Alert>
                )}

                <form
                  onSubmit={handleTambahTanpaAkun}
                  className="flex flex-col gap-3"
                >
                  <Input
                    size="md"
                    type="text"
                    required
                    aria-label="Nama Anggota"
                    value={namaTanpaAkun}
                    onChange={(e) => setNamaTanpaAkun(e.target.value)}
                    placeholder="Nama Anggota (misal: Budi)"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      loading={tambahTanpaAkun.isPending}
                      disabled={!namaTanpaAkun.trim()}
                    >
                      {tambahTanpaAkun.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNamaTanpaAkun("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Daftar Anggota */}
            <ul className="flex flex-col">
              {grup.anggota.map((member) => {
                const isOwner = member.user_id === grup.dibuat_oleh;
                const hasAccount = member.user_id !== null;

                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2.5 border-t border-muted py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        aria-hidden="true"
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold",
                          hasAccount
                            ? "bg-primary-soft text-primary-hover"
                            : "bg-avatar-guest text-muted-foreground",
                        )}
                      >
                        {member.nama_tampilan.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {member.nama_tampilan}
                        </p>
                        <p className="text-xs text-muted-foreground">
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

                    <div className="flex shrink-0 items-center gap-2">
                      {isOwner && <Badge variant="accent">Pemilik</Badge>}
                      {hasAccount ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                          title="Anggota Terdaftar (Berakun)"
                        >
                          <UserCheck aria-hidden="true" className="size-3.5 text-positive" />
                          Berakun
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                          title="Anggota Ditambahkan Manual (Tanpa Akun)"
                        >
                          <UserX aria-hidden="true" className="size-3.5 text-warning" />
                          Tanpa Akun
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {grup.is_admin && (
            <Button
              variant="danger-outline"
              fullWidth
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Hapus Grup
            </Button>
          )}
        </aside>
      </div>

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      <Dialog
        open={deletingId !== null}
        onClose={() => {
          if (!hapusPengeluaran.isPending) setDeletingId(null);
        }}
        title="Hapus Pengeluaran?"
        icon={Trash2}
        tone="destructive"
        description="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        actions={
          <Button
            variant="danger"
            loading={hapusPengeluaran.isPending}
            onClick={() => {
              if (deletingId) handleHapusPengeluaran(deletingId);
            }}
          >
            {hapusPengeluaran.isPending ? "Menghapus..." : "Hapus"}
          </Button>
        }
      />

      {/* Modal Konfirmasi Hapus Grup */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          if (!deleteGroup.isPending) setShowDeleteDialog(false);
        }}
        title="Hapus Grup?"
        icon={Trash2}
        tone="destructive"
        description="Menghapus grup akan menghapus semua data grup secara permanen, termasuk anggota, pengeluaran, dan riwayat settlement."
        actions={
          <Button
            variant="danger"
            loading={deleteGroup.isPending}
            onClick={async () => {
              if (!grupId) return;
              try {
                await deleteGroup.mutateAsync(grupId);
                router.push("/dashboard");
              } catch (err) {
                console.error("Gagal menghapus grup:", err);
              }
            }}
          >
            {deleteGroup.isPending ? "Menghapus..." : "Hapus Grup"}
          </Button>
        }
      />
    </div>
  );
}
