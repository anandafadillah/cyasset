"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { saveLocationAction, type LocationLevel } from "@/app/(app)/lokasi/actions";

export type LocationDialogTarget = {
  level: LocationLevel;
  mode: "create" | "edit";
  id?: string;
  parentId?: string;
  initialNama?: string;
};

const levelLabel: Record<LocationLevel, string> = {
  gedung: "Gedung",
  lantai: "Lantai",
  ruang: "Ruang",
  "sub-lokasi": "Sub-lokasi",
};

export function LocationFormDialog({
  target,
  onClose,
}: {
  target: LocationDialogTarget | null;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveLocationAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      onClose();
    });
  }

  const label = target ? levelLabel[target.level] : "";
  const title = target?.mode === "edit" ? `Ubah ${label}` : `Tambah ${label}`;

  return (
    <Modal open={target !== null} onClose={onClose} title={title}>
      {target && (
        <form
          key={`${target.level}-${target.id ?? "new"}-${target.parentId ?? ""}`}
          ref={formRef}
          action={handleSubmit}
          className="flex flex-col gap-3.5"
        >
          <input type="hidden" name="level" value={target.level} />
          {target.mode === "edit" && target.id && <input type="hidden" name="id" value={target.id} />}
          {target.parentId && <input type="hidden" name="parentId" value={target.parentId} />}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nama" className="text-xs font-medium text-muted">
              Nama {label}
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              required
              defaultValue={target.initialNama}
              autoFocus
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>

          <div aria-live="polite" className="min-h-5 text-sm text-danger">
            {error}
          </div>

          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
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
      )}
    </Modal>
  );
}
