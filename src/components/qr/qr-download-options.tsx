"use client";

import { DownloadSimple, FilePdf, Image as ImageIcon } from "@phosphor-icons/react";

export function QrDownloadOptions({
  qrDataUrl,
  filename,
}: {
  qrDataUrl: string;
  filename: string;
}) {
  const safeFilename = filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();

  return (
    <section className="print-hide w-full max-w-2xl" aria-labelledby="qr-download-title">
      <h3 id="qr-download-title" className="mb-3 text-sm font-semibold text-text">
        Pilih format QR
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger">
            <FilePdf size={22} weight="duotone" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-text">Download PDF</span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              Buka dialog cetak, lalu pilih Simpan sebagai PDF.
            </span>
          </span>
        </button>

        <a
          href={qrDataUrl}
          download={`${safeFilename}.png`}
          className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-good-soft text-good">
            <ImageIcon size={22} weight="duotone" />
          </span>
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text">
              Download gambar <DownloadSimple size={15} />
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              Simpan QR resolusi tinggi dalam format PNG.
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
