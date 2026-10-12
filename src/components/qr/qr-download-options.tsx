"use client";

import { useRef, useState } from "react";
import { DownloadSimple, FilePdf, Image as ImageIcon } from "@phosphor-icons/react";
import type { QrCardImage } from "@/lib/qr-card";

export function QrDownloadOptions({
  card,
  filename,
}: {
  card: QrCardImage;
  filename: string;
}) {
  const safeFilename = filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim();
  const downloading = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadPng() {
    if (downloading.current) return;
    downloading.current = true;
    setIsDownloading(true);
    setError(null);
    try {
      const image = new window.Image();
      image.src = card.dataUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      // Export at 3× resolution; QR modules remain crisp because the source is vector.
      canvas.width = card.width * 3;
      canvas.height = card.height * 3;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG export failed")), "image/png");
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename || "QR_CyAsset"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to finish reading the blob before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("Gambar QR gagal diunduh. Silakan coba lagi.");
    } finally {
      downloading.current = false;
      setIsDownloading(false);
    }
  }

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

        <button
          type="button"
          onClick={downloadPng}
          disabled={isDownloading}
          aria-busy={isDownloading}
          className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-good-soft text-good">
            <ImageIcon size={22} weight="duotone" />
          </span>
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text">
              {isDownloading ? "Menyiapkan gambar…" : "Download gambar"} <DownloadSimple size={15} />
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              Simpan seluruh card beserta QR dalam format PNG.
            </span>
          </span>
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
