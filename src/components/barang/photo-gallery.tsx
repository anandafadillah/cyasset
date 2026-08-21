"use client";

import { useEffect, useState } from "react";
import { CaretLeft, CaretRight, Image as ImageIcon, X } from "@phosphor-icons/react";

export function PhotoGallery({ photos, alt }: { photos: { id: string; path: string }[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="grid h-50 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-faint">
        <div className="text-center">
          <ImageIcon size={34} />
          <div className="mt-1.5 text-xs">Foto kondisi awal</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpenIndex(0)} className="block w-full cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0].path}
          alt={alt}
          className="h-50 w-full rounded-xl border border-border object-cover"
        />
      </button>
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {photos.slice(1).map((foto, i) => (
            <button key={foto.id} type="button" onClick={() => setOpenIndex(i + 1)} className="cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.path}
                alt={alt}
                className="size-14 rounded-lg border border-border object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          alt={alt}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}

function PhotoLightbox({
  photos,
  alt,
  index,
  onClose,
  onNavigate,
}: {
  photos: { id: string; path: string }[];
  alt: string;
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (hasMultiple && event.key === "ArrowRight") onNavigate((index + 1) % photos.length);
      if (hasMultiple && event.key === "ArrowLeft") onNavigate((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, index, photos.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        title="Tutup"
        className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate((index - 1 + photos.length) % photos.length);
            }}
            title="Sebelumnya"
            className="absolute left-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CaretLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate((index + 1) % photos.length);
            }}
            title="Berikutnya"
            className="absolute right-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CaretRight size={20} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index].path}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
  );
}
