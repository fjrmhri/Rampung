import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ grupId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { grupId } = await params;

  if (!grupId) {
    return NextResponse.json(
      { error: "ID grup tidak ditemukan." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Anda harus login untuk menghapus grup." },
      { status: 401 },
    );
  }

  const { error } = await supabase.from("grup").delete().eq("id", grupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
