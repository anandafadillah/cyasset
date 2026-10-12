"use client";

import { useId, useRef, useState } from "react";
import { CaretLeft, CaretRight, Image as ImageIcon } from "@phosphor-icons/react";

export function PublicPhotoCarousel({
  photos,
  alt,
  caption,
}: {
  photos: { id: string; path: string }[];
  alt: string;
  caption?: string;
}) {
  const trackId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = photos.length > 1;
  const currentIndex = Math.min(activeIndex, Math.max(0, photos.length - 1));

  function navigate(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(index, photos.length - 1));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  if (photos.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-dashed border-border bg-surface-2 text-muted">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon size={32} aria-hidden="true" />
          <span className="text-xs">Belum ada foto</span>
        </div>
      </div>
    );
  }

  return (
    <section aria-label={`Foto ${alt}`} aria-roledescription="carousel" className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-2">
      <div className="relative">
        <div
          ref={trackRef}
          id={trackId}
          tabIndex={hasMultiple ? 0 : undefined}
          aria-label={hasMultiple ? "Geser foto atau gunakan tombol panah kiri dan kanan" : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              setActiveIndex(Math.max(0, Math.min(photos.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
            }
          }}
          onKeyDown={(event) => {
            if (!hasMultiple) return;
            const target = {
              ArrowLeft: currentIndex - 1,
              ArrowRight: currentIndex + 1,
              Home: 0,
              End: photos.length - 1,
            }[event.key];
            if (target === undefined) return;
            event.preventDefault();
            navigate(target);
          }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${photos.length}`}
              className="w-full shrink-0 snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.path}
                alt={hasMultiple ? `${alt} — foto ${index + 1}` : alt}
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
                className="h-52 w-full object-contain"
              />
            </div>
          ))}
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Foto sebelumnya"
              aria-controls={trackId}
              disabled={currentIndex === 0}
              onClick={() => navigate(currentIndex - 1)}
              className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-30"
            >
              <CaretLeft size={20} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Foto berikutnya"
              aria-controls={trackId}
              disabled={currentIndex === photos.length - 1}
              onClick={() => navigate(currentIndex + 1)}
              className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-30"
            >
              <CaretRight size={20} weight="bold" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {(hasMultiple || caption) && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs text-muted">
          <span>{caption || "Geser untuk melihat foto lainnya"}</span>
          {hasMultiple && (
            <span aria-live="polite" aria-atomic="true" className="shrink-0 tabular-nums">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
