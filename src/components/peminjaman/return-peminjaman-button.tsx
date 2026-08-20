"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";
import { returnPeminjamanAction } from "@/app/(app)/peminjaman/actions";

export function ReturnPeminjamanButton({ id, peminjamNama }: { id: string; peminjamNama: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await returnPeminjamanAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
      >
        Kembalikan
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Kembalikan Peminjaman — ${peminjamNama}`}>
        <form action={handleSubmit} className="flex flex-col gap-3.5">
          <input type="hidden" name="id" value={id} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Foto Kondisi Akhir <span className="text-dim">(opsional)</span>
            </label>
            <PhotoUploadField />
          </div>

          <div aria-live="polite" className="min-h-5 text-sm text-danger">
            {error}
          </div>

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Memproses…" : "Konfirmasi Pengembalian"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
