import { NextResponse } from "next/server";
import { and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { prasarana } from "@/db/schema";
import { renderLaporanTabelPdf } from "@/lib/render-laporan-pdf";
import { renderLaporanExcel } from "@/lib/render-laporan-excel";
import { jenisLabel, statusLabel, sumberDanaLabel, formatRupiah } from "@/lib/prasarana-format";

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

  const rows = await db.query.prasarana.findMany({
    where: and(gte(prasarana.createdAt, dariDate), lte(prasarana.createdAt, sampaiDate)),
    orderBy: (table, { asc }) => asc(table.createdAt),
  });

  const totalNominal = rows.reduce((sum, row) => sum + (row.nominalDana ?? 0), 0);

  const kolom = ["Nama Pekerjaan", "Jenis", "Lokasi", "Sumber Dana", "Periode", "Nominal", "Status", "Mulai", "Selesai"];
  const baris = rows.map((row) => [
    row.nama,
    jenisLabel[row.jenis] ?? row.jenis,
    row.lokasi ?? "-",
    row.sumberDana === "lainnya" ? row.sumberDanaLainnya || "Lainnya" : sumberDanaLabel[row.sumberDana] ?? row.sumberDana,
    row.periodeDana ?? "-",
    row.nominalDana != null ? row.nominalDana : "",
    statusLabel[row.status] ?? row.status,
    row.tanggalMulai,
    row.tanggalSelesai ?? "-",
  ]);

  if (format === "excel") {
    const buffer = await renderLaporanExcel("Rekap Prasarana", kolom, baris);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Rekap_Prasarana_${dari}_${sampai}.xlsx"`,
      },
    });
  }

  const buffer = await renderLaporanTabelPdf({
    judul: "REKAP PEKERJAAN PRASARANA",
    meta: [
      `Rentang: ${dari} s/d ${sampai}`,
      `Total pekerjaan: ${rows.length}`,
      `Total nominal dana: ${formatRupiah(totalNominal)}`,
    ],
    kolom: [
      { label: "Nama Pekerjaan", flex: 2 },
      { label: "Jenis", width: 80 },
      { label: "Sumber Dana", width: 75 },
      { label: "Nominal", width: 70 },
      { label: "Status", width: 65 },
      { label: "Mulai", width: 55 },
      { label: "Selesai", width: 55 },
    ],
    baris: rows.map((row) => [
      row.nama,
      jenisLabel[row.jenis] ?? row.jenis,
      row.sumberDana === "lainnya" ? row.sumberDanaLainnya || "Lainnya" : sumberDanaLabel[row.sumberDana] ?? row.sumberDana,
      row.nominalDana != null ? formatRupiah(row.nominalDana) : "-",
      statusLabel[row.status] ?? row.status,
      row.tanggalMulai,
      row.tanggalSelesai ?? "-",
    ]),
    pesanKosong: "Tidak ada pekerjaan prasarana pada rentang tanggal ini.",
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Rekap_Prasarana_${dari}_${sampai}.pdf"`,
    },
  });
}
