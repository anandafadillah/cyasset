"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileArrowDown } from "@phosphor-icons/react";
import { createPeminjamanEksternalAction } from "@/app/(app)/peminjaman/actions";
import { PeminjamanItemPicker, type BarangOption } from "@/components/peminjaman/peminjaman-item-picker";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PeminjamanEksternalForm({ barangOptions }: { barangOptions: BarangOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPeminjamanEksternalAction(null, formData);
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
            <Field label="Nama Peminjam / Instansi" name="peminjamNama" required />
            <Field label="Penanggung Jawab" name="penanggungJawab" required />
            <Field label="No. HP" name="peminjamKontak" />
            <Field label="Lokasi Pemanfaatan" name="lokasiPemanfaatan" required />
            <Field label="Tanggal Mulai" name="tanggalPinjam" type="date" required defaultValue={today()} />
            <Field label="Rencana Kembali" name="tanggalRencanaKembali" type="date" required defaultValue={today()} />
            <div className="sm:col-span-2">
              <TextAreaField label="Tujuan Peminjaman" name="tujuan" required />
            </div>
          </div>
        </Panel>

        <Panel title="Barang Dipinjam">
          <PeminjamanItemPicker barangOptions={barangOptions} />
        </Panel>
      </div>

      <div className="flex flex-col gap-4.5">
        <div className="rounded-xl border border-accent-strong bg-surface p-5">
          <div className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
            Nomor surat otomatis
          </div>
          <p className="text-xs text-muted">
            Nomor surat dibuat otomatis saat data disimpan — urut berjalan tahun ini, format
            NNN/SARPRAS/CY/bulan-romawi/tahun.
          </p>
        </div>

        <Panel title="Foto Kondisi Awal" subtitle="(opsional)">
          <PhotoUploadField />
        </Panel>
      </div>

      <div className="flex items-center gap-3 xl:col-span-2">
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
            <FileArrowDown size={16} weight="bold" />
            {isPending ? "Menyimpan…" : "Simpan & Terbitkan Surat"}
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
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
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
        required={required}
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
