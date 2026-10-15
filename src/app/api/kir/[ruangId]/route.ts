import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKirRuang } from "@/lib/kir-data";
import { tanggalDokumenDari } from "@/lib/kir";
import { renderKirPdf } from "@/lib/render-kir-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ ruangId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { ruangId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ruangId)) {
    return NextResponse.json({ error: "Ruang tidak ditemukan." }, { status: 404 });
  }

  const data = await getKirRuang(ruangId);
  if (!data) {
    return NextResponse.json({ error: "Ruang tidak ditemukan." }, { status: 404 });
  }

  const tanggal = tanggalDokumenDari(new URL(request.url).searchParams.get("tanggal"));
  const buffer = await renderKirPdf([data], tanggal);
  const filename = `KIR_${data.ruang.nama.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
