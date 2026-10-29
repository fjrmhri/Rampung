"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuatGrup } from "@/hooks/useGrup";
import { Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { IconTile } from "@/components/ui/IconTile";
import { Input } from "@/components/ui/Input";

export default function BuatGrupPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const buatGrup = useBuatGrup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    try {
      const newGrup = await buatGrup.mutateAsync({
        nama,
        namaPemilik: namaPemilik.trim() || undefined,
      });
      router.push(`/grup/${newGrup.id}`);
    } catch (err) {
      console.error("Gagal membuat grup:", err);
    }
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-5">
      <BackLink href="/dashboard">Kembali ke Dashboard</BackLink>

      <Card className="flex flex-col gap-6 p-[clamp(20px,4vw,32px)] shadow-xs">
        <div className="flex items-center gap-3.5">
          <IconTile icon={Users} size="md" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">
              Buat Grup Baru
            </h1>
            <p className="text-sm text-muted-foreground">
              Mulai patungan dan kelola utang bersama teman
            </p>
          </div>
        </div>

        {buatGrup.isError && <Alert>{buatGrup.error.message}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field label="Nama Grup" htmlFor="nama" required>
            <Input
              id="nama"
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Liburan Bali 2026, Kos Melati"
            />
          </Field>

          <Field label="Nama Anda di Grup" htmlFor="namaPemilik" optional>
            <Input
              id="namaPemilik"
              type="text"
              value={namaPemilik}
              onChange={(e) => setNamaPemilik(e.target.value)}
              placeholder="Nama yang ingin tampil di grup (misal: Budi)"
            />
          </Field>

          <Alert variant="info">
            <span className="text-pretty">
              Sebagai pembuat grup, Anda akan otomatis terdaftar sebagai anggota
              pertama. Jika ingin tampil berbeda, isi &quot;Nama Anda di
              Grup&quot;.
            </span>
          </Alert>

          <Button
            id="btn-submit-buat-grup"
            type="submit"
            size="lg"
            fullWidth
            loading={buatGrup.isPending}
            disabled={!nama.trim()}
          >
            {buatGrup.isPending ? "Membuat Grup..." : "Buat Grup"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
