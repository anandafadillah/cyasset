"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { tambahUnitPenggantiAction } from "@/app/(app)/laporan-kerusakan/actions";

export function TambahUnitPenggantiButton({
  laporanId,
  barangNama,
  isUnitMode,
}: {
  laporanId: string;
  barangNama: string;
  isUnitMode: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await tambahUnitPenggantiAction(null, formData);
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
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted hover:text-text"
      >
        <Plus size={11} />
        Unit Pengganti
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Unit Pengganti — ${barangNama}`}>
        <form action={handleSubmit} className="flex flex-col gap-3.5">
          <input type="hidden" name="laporanId" value={laporanId} />
          {isUnitMode ? (
            <p className="text-[13px] text-muted">
              Menambahkan <strong className="text-text">1 unit fisik baru</strong> sebagai pengganti unit yang
              sudah diganti/write-off — sub-kode lanjut otomatis. QR unit baru perlu dicetak & ditempel ulang.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="jumlah" className="text-xs font-medium text-muted">
                Jumlah unit pengganti
              </label>
              <input
                id="jumlah"
                name="jumlah"
                type="number"
                min={1}
                required
                defaultValue={1}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
              />
              <p className="text-[11px] text-dim">
                Menambah Jumlah Unit &amp; Baik pada barang ini setelah unit lama di-write-off.
              </p>
            </div>
          )}

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
              {isPending ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
