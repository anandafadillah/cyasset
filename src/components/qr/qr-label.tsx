import type { QrCardImage } from "@/lib/qr-card";

export function QrLabel({ card }: { card: QrCardImage }) {
  return (
    <div className="w-80 max-w-full shrink-0 print:w-[60mm]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.dataUrl}
        alt={card.alt}
        width={card.width}
        height={card.height}
        className="qr-card-preview block h-auto w-full rounded-[14px]"
      />
    </div>
  );
}
