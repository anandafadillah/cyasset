"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { createPeminjamanInternalAction } from "@/app/(app)/peminjaman/actions";
import { PeminjamanItemPicker, type BarangOption } from "@/components/peminjaman/peminjaman-item-picker";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PeminjamanInternalForm({ barangOptions }: { barangOptions: BarangOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPeminjamanInternalAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 items-start gap-5.5 xl:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4.5">
        <Panel title="Peminjam">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Nama Peminjam" name="peminjamNama" required />
            <Field label="No. HP" name="peminjamKontak" />
            <Field
              label="Keterangan"
              name="peminjamKeterangan"
              placeholder="mis. Guru Produktif TKJ, XII TKJ 1"
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <TextAreaField label="Tujuan Peminjaman" name="tujuan" required />
            </div>
            <Field label="Tanggal Pinjam" name="tanggalPinjam" type="date" required defaultValue={today()} />
            <Field label="Rencana Kembali" name="tanggalRencanaKembali" type="date" required defaultValue={today()} />
          </div>
        </Panel>

        <Panel title="Barang Dipinjam">
          <PeminjamanItemPicker barangOptions={barangOptions} />
        </Panel>
      </div>

      <Panel title="Foto Kondisi Awal" subtitle="(opsional)">
        <PhotoUploadField />
      </Panel>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center gap-3 border-t border-border bg-surface px-6 py-4 xl:col-span-2">
        <div aria-live="polite" className="text-sm text-danger">
          {error}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-text"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Check size={16} weight="bold" />
            {isPending ? "Menyimpan…" : "Simpan Peminjaman"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text">
        {title}
        {subtitle && <span className="ml-1.5 text-xs font-normal text-dim">{subtitle}</span>}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={3}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}
