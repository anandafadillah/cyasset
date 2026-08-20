import { NextResponse } from "next/server";
import { and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { laporanKerusakan } from "@/db/schema";
import { renderLaporanTabelPdf } from "@/lib/render-laporan-pdf";
import { renderLaporanExcel } from "@/lib/render-laporan-excel";

const statusLabel: Record<string, string> = {
  masuk: "Masuk",
  diproses: "Diproses",
  selesai: "Selesai",
  ganti_unit: "Ganti Unit",
};
const tingkatLabel: Record<string, string> = { rusak_ringan: "Rusak Ringan", rusak_berat: "Rusak Berat" };

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const format = searchParams.get("format") === "excel" ? "excel" : "pdf";
  if (!dari || !sampai) {
    return NextResponse.json({ error: "Rentang tanggal wajib diisi." }, { status: 400 });
  }

  const dariDate = new Date(`${dari}T00:00:00`);
  const sampaiDate = new Date(`${sampai}T23:59:59`);

  const rows = await db.query.laporanKerusakan.findMany({
    where: and(gte(laporanKerusakan.createdAt, dariDate), lte(laporanKerusakan.createdAt, sampaiDate)),
    orderBy: (table, { asc }) => asc(table.createdAt),
    with: { barang: true },
  });

  const kolom = ["Kode Tiket", "Barang", "Deskripsi", "Unit Terdampak", "Tingkat", "Status", "Tanggal"];
  const baris = rows.map((row) => [
    row.kodeTiket,
    row.barang.nama,
    row.deskripsi,
    row.jumlahUnitTerdampak,
    tingkatLabel[row.tingkatKerusakan] ?? row.tingkatKerusakan,
    statusLabel[row.status] ?? row.status,
    row.createdAt.toISOString().slice(0, 10),
  ]);

  if (format === "excel") {
    const buffer = await renderLaporanExcel("Riwayat Perbaikan", kolom, baris);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Riwayat_Perbaikan_${dari}_${sampai}.xlsx"`,
      },
    });
  }

  const buffer = await renderLaporanTabelPdf({
    judul: "RIWAYAT PERBAIKAN",
    meta: [`Rentang: ${dari} s/d ${sampai}`, `Total tiket: ${rows.length}`],
    kolom: [
      { label: "Kode", width: 55 },
      { label: "Barang", flex: 1.5 },
      { label: "Deskripsi", flex: 2 },
      { label: "Tingkat", width: 65 },
      { label: "Status", width: 60 },
      { label: "Tanggal", width: 55 },
    ],
    baris: baris.map((row) => [String(row[0]), String(row[1]), String(row[2]), String(row[4]), String(row[5]), String(row[6])]),
    pesanKosong: "Tidak ada laporan kerusakan pada rentang tanggal ini.",
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Riwayat_Perbaikan_${dari}_${sampai}.pdf"`,
    },
  });
}
