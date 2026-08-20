export function QrLabel({ qrDataUrl, nama, kode }: { qrDataUrl: string; nama: string; kode: string }) {
  return (
    <div className="flex w-64 flex-col items-center gap-2 rounded-xl border border-border bg-white p-5 text-center print:border-2 print:border-black print:shadow-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt={`QR Code ${nama}`} className="size-48" />
      <div className="text-sm font-semibold text-black">{nama}</div>
      <div className="font-mono text-xs text-black/70">{kode}</div>
    </div>
  );
}
