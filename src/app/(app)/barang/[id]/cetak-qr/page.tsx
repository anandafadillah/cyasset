import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { QrLabel } from "@/components/qr/qr-label";
import { QrDownloadOptions } from "@/components/qr/qr-download-options";
import { generateQrCardImage } from "@/lib/qr-card";
import { db } from "@/db";
import { barang, barangUnit } from "@/db/schema";

export default async function CetakQrBarangPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unit?: string }>;
}) {
  const { id } = await params;
  const { unit: unitId } = await searchParams;

  const item = await db.query.barang.findFirst({
    where: eq(barang.id, id),
    with: {
      ruang: { with: { lantai: { with: { gedung: true } } } },
      subLokasi: true,
      lokasi: { columns: { id: true } },
    },
  });
  if (!item) notFound();

  let qrTarget: { path: string; nama: string; kode: string; lokasi: string };

  if (unitId) {
    const unit = await db.query.barangUnit.findFirst({
      where: eq(barangUnit.id, unitId),
      with: {
        ruang: { with: { lantai: { with: { gedung: true } } } },
        subLokasi: true,
      },
    });
    if (!unit || unit.barangId !== item.id) notFound();
    qrTarget = {
      path: `/s/unit/${unit.id}`,
      nama: item.nama,
      kode: unit.subKode,
      lokasi: [unit.ruang.nama, unit.ruang.lantai.nama, unit.ruang.lantai.gedung.nama, unit.subLokasi?.nama]
        .filter(Boolean).join(" · "),
    };
  } else {
    qrTarget = {
      path: `/s/barang/${item.id}`,
      nama: item.nama,
      kode: item.kode,
      lokasi: item.lokasi.length > 1
        ? `${item.lokasi.length} lokasi · lihat detail aset`
        : [item.ruang.nama, item.ruang.lantai.nama, item.ruang.lantai.gedung.nama, item.subLokasi?.nama]
          .filter(Boolean).join(" · "),
    };
  }

  const card = await generateQrCardImage({
    ...qrTarget,
    kategori: item.kategori || "Inventaris",
    canReportDamage: true,
  });

  return (
    <>
      <div className="print-hide sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link
          href={`/barang/${item.id}`}
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Cetak QR</h2>
          <div className="mt-0.5 text-xs text-dim">Barang / {qrTarget.kode} / Cetak QR</div>
        </div>
      </div>
      <div className="qr-print-content flex flex-1 flex-col items-center justify-center gap-8 p-6 sm:p-10">
        <QrLabel card={card} />
        <QrDownloadOptions card={card} filename={`QR_${qrTarget.kode}`} />
      </div>
    </>
  );
}
