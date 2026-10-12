"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Plus, UploadSimple, X } from "@phosphor-icons/react";

export function PhotoUploadField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function syncInput(nextFiles: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  function handleAdd(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return;
    const next = [...files, ...Array.from(newFiles)];
    setFiles(next);
    syncInput(next);
  }

  function handleRemove(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="foto"
        multiple
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => handleAdd(event.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-2 px-6 py-8 text-center text-faint transition-colors hover:border-accent"
      >
        <UploadSimple size={28} />
        <div className="text-sm text-muted">Klik untuk pilih foto</div>
        <div className="text-[11px]">JPG / PNG · maks 5 MB</div>
      </button>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <PhotoThumb key={`${file.name}-${index}`} file={file} onRemove={() => handleRemove(index)} />
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid size-14 flex-none place-items-center rounded-lg border border-dashed border-border text-faint hover:border-accent hover:text-accent"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="photo-thumb group relative flex w-20 flex-none flex-col overflow-hidden rounded-lg border border-border bg-surface-3 xl:size-14">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="aspect-square w-full object-cover xl:size-full" />
      ) : (
        <div className="grid aspect-square w-full place-items-center text-faint">
          <ImageIcon size={18} />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        title="Hapus foto"
        aria-label={`Hapus foto ${file.name}`}
        className="photo-delete grid min-h-11 w-full place-items-center border-t border-border bg-surface-2 text-muted transition-opacity xl:absolute xl:top-0.5 xl:right-0.5 xl:size-4.5 xl:min-h-0 xl:rounded-full xl:bg-black/60 xl:text-white xl:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <X size={11} />
      </button>
    </div>
  );
}
