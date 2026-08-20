import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { peminjaman, staff } from "@/db/schema";
import type { SuratPeminjamanData } from "@/components/surat/surat-peminjaman-pdf";
import { renderSuratPeminjamanPdf } from "@/lib/render-surat-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { id } = await params;

  const row = await db.query.peminjaman.findFirst({
    where: eq(peminjaman.id, id),
    with: { items: { with: { barang: true } } },
  });

  if (!row || row.jenis !== "eksternal" || !row.nomorSurat) {
    return NextResponse.json({ error: "Surat peminjaman tidak ditemukan." }, { status: 404 });
  }

  const [petugas] = row.createdBy
    ? await db.select({ name: staff.name }).from(staff).where(eq(staff.id, row.createdBy)).limit(1)
    : [];

  const data: SuratPeminjamanData = {
    nomorSurat: row.nomorSurat,
    peminjamNama: row.peminjamNama,
    penanggungJawab: row.penanggungJawab ?? "-",
    tujuan: row.tujuan,
    lokasiPemanfaatan: row.lokasiPemanfaatan ?? "-",
    tanggalPinjam: row.tanggalPinjam,
    tanggalRencanaKembali: row.tanggalRencanaKembali,
    tanggalTerbit: row.createdAt.toISOString().slice(0, 10),
    petugasNama: petugas?.name ?? "-",
    items: row.items.map((item) => ({ nama: item.barang.nama, jumlah: item.jumlah })),
  };

  const buffer = await renderSuratPeminjamanPdf(data);
  const filename = `Surat_Peminjaman_${row.nomorSurat.replace(/\//g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
