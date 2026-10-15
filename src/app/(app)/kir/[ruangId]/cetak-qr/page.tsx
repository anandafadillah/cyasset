import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { QrLabel } from "@/components/qr/qr-label";
import { QrDownloadOptions } from "@/components/qr/qr-download-options";
import { generateQrCardImage } from "@/lib/qr-card";
import { db } from "@/db";
import { ruang } from "@/db/schema";

export default async function CetakQrRuangPage({ params }: { params: Promise<{ ruangId: string }> }) {
  const { ruangId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(ruangId)) notFound();

  const item = await db.query.ruang.findFirst({
    where: eq(ruang.id, ruangId),
    with: { lantai: { with: { gedung: true } } },
  });
  if (!item) notFound();

  const card = await generateQrCardImage({
    path: `/s/ruang/${item.id}`,
    nama: item.nama,
    kategori: "Kartu Inventaris Ruangan",
    kode: item.kode,
    kodeLabel: "KODE RUANG",
    lokasi: `${item.lantai.gedung.nama} · ${item.lantai.nama}`,
    footer: "Scan untuk melihat inventaris ruangan",
  });

  return (
    <>
      <div className="print-hide page-topbar sticky top-0 z-10 flex h-[66px] flex-none items-center gap-3 border-b border-border bg-surface px-6">
        <Link href={`/kir/${item.id}`} className="grid size-8 place-items-center rounded-lg text-muted hover:text-text">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-text">Cetak QR</h2>
          <div className="mt-0.5 text-xs text-dim">Kartu Inventaris Ruangan / {item.nama} / Cetak QR</div>
        </div>
      </div>
      <div className="qr-print-content flex flex-1 flex-col items-center justify-center gap-8 p-4 sm:p-6 sm:p-10">
        <QrLabel card={card} />
        <QrDownloadOptions card={card} filename={`QR_Ruang_${item.nama}`} />
      </div>
    </>
  );
}
