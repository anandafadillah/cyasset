import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, ruang } from "@/db/schema";
import type { LirData } from "@/components/laporan/lir-pdf";
import { renderLirPdf } from "@/lib/render-laporan-pdf";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ruangId = searchParams.get("ruangId");
  if (!ruangId) {
    return NextResponse.json({ error: "Ruang wajib dipilih." }, { status: 400 });
  }

  const ruangRow = await db.query.ruang.findFirst({
    where: eq(ruang.id, ruangId),
    with: { lantai: { with: { gedung: true } } },
  });
  if (!ruangRow) {
    return NextResponse.json({ error: "Ruang tidak ditemukan." }, { status: 404 });
  }

  const items = await db
    .select()
    .from(barang)
    .where(and(eq(barang.ruangId, ruangId), eq(barang.isArchived, false)));

  const data: LirData = {
    ruangNama: ruangRow.nama,
    lantaiNama: ruangRow.lantai.nama,
    gedungNama: ruangRow.lantai.gedung.nama,
    tanggalCetak: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    items: items.map((item) => ({
      nama: item.nama,
      kode: item.kode,
      kategori: item.kategori,
      jumlahUnit: item.jumlahUnit,
      jumlahBaik: item.jumlahBaik,
      jumlahRusakRingan: item.jumlahRusakRingan,
      jumlahRusakBerat: item.jumlahRusakBerat,
    })),
  };

  const buffer = await renderLirPdf(data);
  const filename = `LIR_${ruangRow.nama.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
