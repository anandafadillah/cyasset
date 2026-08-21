import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { barang, barangLokasi, barangUnit, ruang } from "@/db/schema";
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

  // Barang mode batch bisa tersebar di banyak ruang (barang_lokasi) — ambil
  // cuma porsi yang benar-benar ada di ruang ini, bukan total keseluruhan
  // barangnya. Barang mode unit juga sama: tiap unit fisik punya ruangId
  // sendiri di barang_unit (bisa pindah dari lokasi awal barangnya).
  const [batchItems, unitItems] = await Promise.all([
    db
      .select({
        nama: barang.nama,
        kode: barang.kode,
        kategori: barang.kategori,
        jumlahUnit: barangLokasi.jumlah,
        jumlahBaik: barangLokasi.jumlahBaik,
        jumlahRusakRingan: barangLokasi.jumlahRusakRingan,
        jumlahRusakBerat: barangLokasi.jumlahRusakBerat,
      })
      .from(barangLokasi)
      .innerJoin(barang, eq(barangLokasi.barangId, barang.id))
      .where(and(eq(barangLokasi.ruangId, ruangId), eq(barang.isArchived, false))),
    db
      .select({
        nama: barang.nama,
        kode: barang.kode,
        kategori: barang.kategori,
        jumlahUnit: sql<number>`count(*) filter (where ${barangUnit.kondisi} != 'diganti')::int`,
        jumlahBaik: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'baik')::int`,
        jumlahRusakRingan: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'rusak_ringan')::int`,
        jumlahRusakBerat: sql<number>`count(*) filter (where ${barangUnit.kondisi} = 'rusak_berat')::int`,
      })
      .from(barangUnit)
      .innerJoin(barang, eq(barangUnit.barangId, barang.id))
      .where(and(eq(barangUnit.ruangId, ruangId), eq(barang.isArchived, false)))
      .groupBy(barangUnit.barangId, barang.nama, barang.kode, barang.kategori),
  ]);

  const data: LirData = {
    ruangNama: ruangRow.nama,
    lantaiNama: ruangRow.lantai.nama,
    gedungNama: ruangRow.lantai.gedung.nama,
    tanggalCetak: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    items: [...batchItems, ...unitItems],
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
