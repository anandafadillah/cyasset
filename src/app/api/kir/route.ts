import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKirBanyakRuang } from "@/lib/kir-data";
import { tanggalDokumenDari } from "@/lib/kir";
import { renderKirPdf } from "@/lib/render-kir-pdf";

// Cetak semua KIR dalam satu PDF — satu ruang per halaman, opsional per gedung.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gedungId = searchParams.get("gedungId") || undefined;
  if (gedungId && !/^[0-9a-f-]{36}$/i.test(gedungId)) {
    return NextResponse.json({ error: "Gedung tidak ditemukan." }, { status: 404 });
  }

  const halaman = await getKirBanyakRuang({ gedungId });
  if (halaman.length === 0) {
    return NextResponse.json({ error: "Tidak ada ruang untuk dicetak." }, { status: 404 });
  }

  const tanggal = tanggalDokumenDari(searchParams.get("tanggal"));
  const buffer = await renderKirPdf(halaman, tanggal);
  const nama = gedungId ? halaman[0].ruang.gedungNama.replace(/[^a-z0-9]+/gi, "_") : "Semua";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="KIR_${nama}_${tanggal}.pdf"`,
    },
  });
}
