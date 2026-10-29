"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGabungGrup } from "@/hooks/useGrup";
import { UserPlus, KeyRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { IconTile } from "@/components/ui/IconTile";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

function FormGabungGrup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Prefill dari /grup/gabung?kode=<kode>
  const [kode, setKode] = useState(() => searchParams.get("kode") ?? "");
  const [nama, setNama] = useState("");
  const gabungGrup = useGabungGrup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) return;

    try {
      const targetGrupId = await gabungGrup.mutateAsync({
        kode: kode.trim(),
        nama: nama.trim() || undefined,
      });
      router.push(`/grup/${targetGrupId}`);
    } catch (err) {
      console.error("Gagal bergabung ke grup:", err);
    }
  };

  return (
    <Card className="flex flex-col gap-6 p-[clamp(20px,4vw,32px)] shadow-xs">
      <div className="flex items-center gap-3.5">
        <IconTile icon={UserPlus} size="md" />
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">
            Gabung Grup
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan kode undangan dari admin grup untuk bergabung
          </p>
        </div>
      </div>

      {gabungGrup.isError && <Alert>{gabungGrup.error.message}</Alert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label="Kode Undangan" htmlFor="kode" required>
          <div className="relative">
            <KeyRound
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="kode"
              type="text"
              required
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Contoh: a1b2c3d4"
              className="pl-[42px] font-mono tracking-[0.04em]"
            />
          </div>
        </Field>

        <Field label="Nama Tampilan di Grup" htmlFor="nama" optional>
          <Input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Kosongkan untuk menggunakan email akun Anda"
          />
        </Field>

        <Button
          id="btn-submit-gabung-grup"
          type="submit"
          size="lg"
          fullWidth
          loading={gabungGrup.isPending}
          disabled={!kode.trim()}
        >
          {gabungGrup.isPending ? "Memproses..." : "Gabung ke Grup"}
        </Button>
      </form>
    </Card>
  );
}

export default function GabungGrupPage() {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-5">
      <BackLink href="/dashboard">Kembali ke Dashboard</BackLink>

      <Suspense
        fallback={
          <div className="flex justify-center p-8 text-muted-foreground">
            <Spinner className="size-6" />
          </div>
        }
      >
        <FormGabungGrup />
      </Suspense>
    </div>
  );
}
