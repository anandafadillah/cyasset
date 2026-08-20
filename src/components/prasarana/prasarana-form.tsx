"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { createPrasaranaAction, updatePrasaranaAction } from "@/app/(app)/prasarana/actions";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

export type PrasaranaFormInitial = {
  id: string;
  nama: string;
  jenis: string;
  deskripsi: string | null;
  lokasi: string | null;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  sumberDana: string;
  sumberDanaLainnya: string | null;
  periodeDana: string | null;
  nominalDana: number | null;
  existingPhotos: { id: string; path: string }[];
};

const jenisOptions = [
  { value: "pembangunan_baru", label: "Pembangunan Baru" },
  { value: "perbaikan", label: "Perbaikan" },
  { value: "pemeliharaan", label: "Pemeliharaan" },
];

const statusOptions = [
  { value: "direncanakan", label: "Direncanakan" },
  { value: "proses", label: "Sedang Proses" },
  { value: "selesai", label: "Selesai" },
];

const sumberDanaOptions = [
  { value: "ssg", label: "SSG (Sekolah Swasta Gratis)" },
  { value: "bos", label: "BOS" },
  { value: "komite_sekolah", label: "Komite Sekolah" },
  { value: "mandiri_yayasan", label: "Mandiri Yayasan" },
  { value: "lainnya", label: "Lainnya" },
];

export function PrasaranaForm({ initialData }: { initialData?: PrasaranaFormInitial }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData;

  const [status, setStatus] = useState(initialData?.status ?? "direncanakan");
  const [sumberDana, setSumberDana] = useState(initialData?.sumberDana ?? "ssg");

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updatePrasaranaAction(null, formData)
        : await createPrasaranaAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 items-start gap-5.5 xl:grid-cols-[1fr_340px]">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}
      <div className="flex flex-col gap-4.5">
        <Panel title="Identitas Pekerjaan">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField
              label="Nama Pekerjaan"
              name="nama"
              required
              className="sm:col-span-2"
              placeholder="mis. Pembangunan Ruang Lab Komputer 2"
              defaultValue={initialData?.nama}
            />
            <SelectField
              label="Jenis Pekerjaan"
              name="jenis"
              required
              options={jenisOptions}
              defaultValue={initialData?.jenis}
            />
            <TextField
              label="Lokasi"
              name="lokasi"
              placeholder="mis. Gedung B Lantai 1"
              hint="(opsional)"
              defaultValue={initialData?.lokasi ?? undefined}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Keterangan"
                name="deskripsi"
                placeholder="Detail pekerjaan yang dilakukan…"
                defaultValue={initialData?.deskripsi ?? undefined}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Status & Waktu Pengerjaan">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <SelectField
              label="Status"
              name="status"
              required
              options={statusOptions}
              value={status}
              onChange={setStatus}
            />
            <DateField label="Tanggal Mulai" name="tanggalMulai" required defaultValue={initialData?.tanggalMulai} />
            <DateField
              label="Tanggal Selesai"
              name="tanggalSelesai"
              required={status === "selesai"}
              hint={status !== "selesai" ? "(terisi otomatis saat status Selesai)" : undefined}
              defaultValue={initialData?.tanggalSelesai ?? undefined}
            />
          </div>
        </Panel>

        <Panel title="Sumber Dana">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SelectField
              label="Sumber Dana"
              name="sumberDana"
              required
              options={sumberDanaOptions}
              value={sumberDana}
              onChange={setSumberDana}
            />
            {sumberDana === "lainnya" && (
              <TextField
                label="Keterangan Sumber Dana"
                name="sumberDanaLainnya"
                required
                placeholder="mis. Donasi alumni"
                defaultValue={initialData?.sumberDanaLainnya ?? undefined}
              />
            )}
            <TextField
              label="Periode"
              name="periodeDana"
              placeholder="mis. TW II 2026"
              hint="(opsional)"
              defaultValue={initialData?.periodeDana ?? undefined}
            />
            <TextField
              label="Nominal Dana (Rp)"
              name="nominalDana"
              type="number"
              placeholder="mis. 15000000"
              hint="(opsional)"
              defaultValue={initialData?.nominalDana != null ? String(initialData.nominalDana) : undefined}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Foto Dokumentasi">
        {initialData && initialData.existingPhotos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {initialData.existingPhotos.map((foto) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto.id}
                src={foto.path}
                alt="Foto dokumentasi tersimpan"
                className="size-14 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
        <PhotoUploadField />
        {isEdit && <p className="mt-2 text-[11px] text-dim">Foto baru akan ditambahkan, foto lama tetap tersimpan.</p>}
      </Panel>

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
            <Check size={16} weight="bold" />
            {isPending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Pekerjaan"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text">{title}</h3>
      {children}
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
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label} {hint && <span className="text-dim">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function DateField({
  label,
  name,
  required,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label} {hint && <span className="text-dim">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        required={required}
        defaultValue={defaultValue ?? undefined}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  options,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={onChange ? undefined : defaultValue}
        value={onChange ? value : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
