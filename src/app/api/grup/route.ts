import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
  const namaPemilik =
    typeof body?.nama_pemilik === "string" ? body.nama_pemilik.trim() : "";

  if (!nama) {
    return NextResponse.json(
      { error: "Nama grup wajib diisi." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json(
      { error: "Anda harus login untuk membuat grup." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("grup")
    .insert({ nama, dibuat_oleh: user.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Jika pemilik menyertakan nama tampilan khusus, perbarui baris anggota
  // yang dibuat oleh trigger `tangani_grup_baru` agar memakai nama tersebut.
  if (namaPemilik) {
    const { error: updateError } = await supabase
      .from("anggota_grup")
      .update({ nama_tampilan: namaPemilik })
      .match({ grup_id: data.id, user_id: user.id });

    if (updateError) {
      console.error("Gagal update nama_tampilan pemilik:", updateError.message);
    }
  }

  return NextResponse.json(data);
}
