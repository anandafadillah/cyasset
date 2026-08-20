"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/modal";
import { createStaffAction } from "@/app/(app)/akun/actions";

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createStaffAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <UserPlus size={16} weight="bold" />
        Tambah Akun
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Akun Staf">
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3.5">
          <Field label="Nama" name="name" autoComplete="name" />
          <Field label="Username" name="username" autoComplete="username" />
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field label="Password" name="password" type="password" autoComplete="new-password" />

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

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}
