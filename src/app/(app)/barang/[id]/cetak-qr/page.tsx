import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { QrLabel } from "@/components/qr/qr-label";
import { PrintQrButton } from "@/components/qr/print-button";
import { generateQrDataUrl } from "@/lib/qr";
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

  const item = await db.query.barang.findFirst({ where: eq(barang.id, id) });
  if (!item) notFound();

  let qrTarget: { path: string; nama: string; kode: string };

  if (unitId) {
    const unit = await db.query.barangUnit.findFirst({ where: eq(barangUnit.id, unitId) });
    if (!unit || unit.barangId !== item.id) notFound();
    qrTarget = { path: `/s/unit/${unit.id}`, nama: item.nama, kode: unit.subKode };
  } else {
    qrTarget = { path: `/s/barang/${item.id}`, nama: item.nama, kode: item.kode };
  }

  const qrDataUrl = await generateQrDataUrl(qrTarget.path);

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
        <div className="ml-auto">
          <PrintQrButton />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-10">
        <QrLabel qrDataUrl={qrDataUrl} nama={qrTarget.nama} kode={qrTarget.kode} />
      </div>
    </>
  );
}
