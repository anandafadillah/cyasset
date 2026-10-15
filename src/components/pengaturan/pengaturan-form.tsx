"use client";

import { useActionState } from "react";
import { Check } from "@phosphor-icons/react";
import { savePengaturanSekolahAction } from "@/app/(app)/pengaturan/actions";
import type { PengaturanSekolah } from "@/lib/pengaturan-sekolah";

export function PengaturanForm({ initialData }: { initialData: PengaturanSekolah }) {
  const [state, formAction, isPending] = useActionState(savePengaturanSekolahAction, null);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="grid grid-cols-1 items-start gap-4.5 xl:grid-cols-2">
        <Panel title="Identitas Sekolah" description="Dipakai di kop Kartu Inventaris Ruangan, surat, dan laporan.">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <TextField
              label="Nama Sekolah / Satuan Kerja"
              name="namaSekolah"
              required
              className="md:col-span-2"
              defaultValue={initialData.namaSekolah}
            />
            <TextField label="Provinsi" name="provinsi" placeholder="mis. Jawa Barat" defaultValue={initialData.provinsi} />
            <TextField
              label="Kabupaten / Kota"
              name="kabupatenKota"
              placeholder="mis. Kota Bandung"
              defaultValue={initialData.kabupatenKota}
            />
            <TextField
              label="Unit"
              name="unit"
              placeholder="mis. Cabang Dinas Pendidikan Wilayah VII"
              className="md:col-span-2"
              defaultValue={initialData.unit}
            />
            <TextField
              label="Kota untuk Tanggal Dokumen"
              name="kotaTandaTangan"
              placeholder="mis. Bandung"
              hint="(mis. “Bandung, 15 Oktober 2026”)"
              className="md:col-span-2"
              defaultValue={initialData.kotaTandaTangan}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-4.5">
          <Panel title="Kepala Sekolah" description="Penanda tangan “Mengetahui” pada dokumen.">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <TextField label="Nama" name="kepalaSekolahNama" defaultValue={initialData.kepalaSekolahNama} />
              <TextField label="NIP" name="kepalaSekolahNip" defaultValue={initialData.kepalaSekolahNip} />
            </div>
          </Panel>
          <Panel title="Pengurus Barang" description="Penanda tangan Kartu Inventaris Ruangan.">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <TextField label="Nama" name="pengurusBarangNama" defaultValue={initialData.pengurusBarangNama} />
              <TextField label="NIP" name="pengurusBarangNip" defaultValue={initialData.pengurusBarangNip} />
            </div>
          </Panel>
          <p className="text-xs text-dim">Kolom yang dikosongkan dicetak sebagai garis titik-titik agar bisa diisi tangan.</p>
        </div>
      </div>

      <div className="form-actions sticky bottom-0 -mx-6 -mb-6 mt-5.5 flex items-center gap-3 border-t border-border bg-surface px-6 py-4">
        <div aria-live="polite" className="text-sm">
          {state && "error" in state && <span className="text-danger">{state.error}</span>}
          {state && "success" in state && !isPending && <span className="text-good">Pengaturan tersimpan.</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Check size={16} weight="bold" />
            {isPending ? "Menyimpan…" : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-dim">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TextField({
  label,
  name,
  required,
  placeholder,
  hint,
  className,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  defaultValue?: string | null;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label} {hint && <span className="text-dim">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}
