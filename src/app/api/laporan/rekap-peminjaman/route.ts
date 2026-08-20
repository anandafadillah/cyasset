import { NextResponse } from "next/server";
import { and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { peminjaman } from "@/db/schema";
import { renderLaporanTabelPdf } from "@/lib/render-laporan-pdf";
import { renderLaporanExcel } from "@/lib/render-laporan-excel";

const statusLabel: Record<string, string> = { dipinjam: "Dipinjam", dikembalikan: "Dikembalikan" };
const jenisLabel: Record<string, string> = { internal: "Internal", eksternal: "Eksternal" };

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

  const rows = await db.query.peminjaman.findMany({
    where: and(gte(peminjaman.tanggalPinjam, dari), lte(peminjaman.tanggalPinjam, sampai)),
    orderBy: (table, { asc }) => asc(table.tanggalPinjam),
    with: { items: { with: { barang: true } } },
  });

  const kolom = ["Peminjam", "Barang", "Jenis", "Tgl Pinjam", "Rencana Kembali", "Kembali Aktual", "Status"];
  const baris = rows.map((row) => [
    row.peminjamNama,
    row.items.map((item) => `${item.barang.nama} ×${item.jumlah}`).join(", "),
    jenisLabel[row.jenis] ?? row.jenis,
    row.tanggalPinjam,
    row.tanggalRencanaKembali,
    row.tanggalKembaliAktual ?? "-",
    statusLabel[row.status] ?? row.status,
  ]);

  if (format === "excel") {
    const buffer = await renderLaporanExcel("Rekap Peminjaman", kolom, baris);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Rekap_Peminjaman_${dari}_${sampai}.xlsx"`,
      },
    });
  }

  const buffer = await renderLaporanTabelPdf({
    judul: "REKAP PEMINJAMAN",
    meta: [`Rentang: ${dari} s/d ${sampai}`, `Total peminjaman: ${rows.length}`],
    kolom: [
      { label: "Peminjam", flex: 2 },
      { label: "Barang", flex: 2 },
      { label: "Jenis", width: 55 },
      { label: "Pinjam", width: 60 },
      { label: "Kembali", width: 60 },
      { label: "Status", width: 65 },
    ],
    baris: baris.map((row) => [row[0], row[1], row[2], row[3], row[4], row[6]]),
    pesanKosong: "Tidak ada peminjaman pada rentang tanggal ini.",
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Rekap_Peminjaman_${dari}_${sampai}.pdf"`,
    },
  });
}
