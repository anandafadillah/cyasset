import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { QrLabel } from "@/components/qr/qr-label";
import { QrDownloadOptions } from "@/components/qr/qr-download-options";
import { generateQrCardImage } from "@/lib/qr-card";
import { jenisLabel } from "@/lib/prasarana-format";
import { db } from "@/db";
import { prasarana } from "@/db/schema";

export default async function CetakQrPrasaranaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db.query.prasarana.findFirst({ where: eq(prasarana.id, id) });
  if (!item) notFound();

  const card = await generateQrCardImage({
    path: `/s/prasarana/${item.id}`,
    nama: item.nama,
    kategori: jenisLabel[item.jenis] ?? item.jenis,
    lokasi: item.lokasi,
  });

  return (
    <>
      <div className="print-hide sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href="/prasarana" className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Cetak QR</h2>
          <div className="mt-0.5 text-xs text-dim">Prasarana / {item.nama} / Cetak QR</div>
        </div>
      </div>
      <div className="qr-print-content flex flex-1 flex-col items-center justify-center gap-8 p-6 sm:p-10">
        <QrLabel card={card} />
        <QrDownloadOptions card={card} filename={`QR_${item.nama}`} />
      </div>
    </>
  );
}
