"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePrasaranaStatusAction } from "@/app/(app)/prasarana/actions";
import { Modal } from "@/components/ui/modal";

const statusOptions = [
  { value: "direncanakan", label: "Direncanakan" },
  { value: "proses", label: "Sedang Proses" },
  { value: "selesai", label: "Selesai" },
];

export function PrasaranaStatusControl({ id, nama, status }: { id: string; nama: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submitStatus(nextStatus: string, tanggalSelesai?: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", nextStatus);
      if (tanggalSelesai) formData.set("tanggalSelesai", tanggalSelesai);
      const result = await updatePrasaranaStatusAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  function handleChange(nextStatus: string) {
    if (nextStatus === "selesai") {
      setError(null);
      setConfirmOpen(true);
      return;
    }
    submitStatus(nextStatus);
  }

  function handleConfirmSubmit(formData: FormData) {
    const tanggalSelesai = formData.get("tanggalSelesai");
    submitStatus("selesai", typeof tanggalSelesai === "string" ? tanggalSelesai : undefined);
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <select
        value={status}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-text outline-none focus:border-accent disabled:opacity-60"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={`Tandai Selesai — ${nama}`}>
        <form action={handleConfirmSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tanggalSelesai" className="text-xs font-medium text-muted">
              Tanggal Selesai
            </label>
            <input
              id="tanggalSelesai"
              name="tanggalSelesai"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>

          <div aria-live="polite" className="min-h-5 text-sm text-danger">
            {error}
          </div>

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Menyimpan…" : "Konfirmasi Selesai"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
