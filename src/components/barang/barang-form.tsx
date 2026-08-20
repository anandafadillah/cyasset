"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "@phosphor-icons/react";
import { createBarangAction, updateBarangAction } from "@/app/(app)/barang/actions";
import type { GedungNode } from "@/components/lokasi/location-explorer";
import { LocationCascadeFields, type LocationCascadeInitial } from "@/components/barang/location-cascade-fields";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

export type BarangFormInitial = {
  id: string;
  nama: string;
  merkTipe: string | null;
  kode: string;
  kategori: string | null;
  spesifikasi: string | null;
  modePelacakan: "batch" | "unit";
  jumlahUnit: number;
  jumlahBaik: number;
  jumlahRusakRingan: number;
  jumlahRusakBerat: number;
  lokasi: LocationCascadeInitial;
  existingPhotos: { id: string; path: string }[];
};

export function BarangForm({
  gedungList,
  initialData,
}: {
  gedungList: GedungNode[];
  initialData?: BarangFormInitial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialData;

  const [modePelacakan, setModePelacakan] = useState<"batch" | "unit">(initialData?.modePelacakan ?? "batch");
  const isUnitMode = modePelacakan === "unit";

  const [jumlahUnit, setJumlahUnit] = useState(initialData?.jumlahUnit ?? 0);
  const [jumlahBaik, setJumlahBaik] = useState(initialData?.jumlahBaik ?? 0);
  const [jumlahRusakRingan, setJumlahRusakRingan] = useState(initialData?.jumlahRusakRingan ?? 0);
  const [jumlahRusakBerat, setJumlahRusakBerat] = useState(initialData?.jumlahRusakBerat ?? 0);

  const totalKondisi = jumlahBaik + jumlahRusakRingan + jumlahRusakBerat;
  const totalCocok = useMemo(() => jumlahUnit > 0 && totalKondisi === jumlahUnit, [jumlahUnit, totalKondisi]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateBarangAction(null, formData)
        : await createBarangAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-1 flex-col">
      <div className="grid flex-1 grid-cols-1 items-start gap-5.5 xl:grid-cols-[1fr_340px]">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}
      <div className="flex flex-col gap-4.5">
        <Panel title="Identitas Barang">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <TextField
              label="Nama Barang"
              name="nama"
              required
              className="sm:col-span-2"
              defaultValue={initialData?.nama}
            />
            <TextField
              label="Kategori"
              name="kategori"
              placeholder="mis. Multimedia"
              defaultValue={initialData?.kategori ?? undefined}
            />
            <TextField label="Merk / Tipe" name="merkTipe" defaultValue={initialData?.merkTipe ?? undefined} />
            <TextField
              label="Kode / No. Seri"
              name="kode"
              required
              hint="(manual, unik)"
              defaultValue={initialData?.kode}
            />
            <div className="sm:col-span-3">
              <TextAreaField
                label="Spesifikasi Teknis"
                name="spesifikasi"
                defaultValue={initialData?.spesifikasi ?? undefined}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Mode Pelacakan"
          subtitle={isEdit ? "(terkunci setelah barang dibuat)" : "(pilih sesuai jenis barang)"}
        >
          {isEdit ? (
            <>
              <input type="hidden" name="modePelacakan" value={modePelacakan} />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isUnitMode ? "bg-accent-soft text-accent" : "bg-surface-3 text-muted"
                }`}
              >
                {isUnitMode ? "Per-Unit" : "Batch"}
              </span>
              {isUnitMode && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-dim">
                  <Info size={13} />
                  Unit fisik & breakdown kondisi dikelola dari halaman Detail Barang, bukan form ini.
                </p>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ModeOption
                name="modePelacakan"
                value="batch"
                title="Batch"
                description="1 QR Code mewakili semua unit dalam jenis ini. Cocok untuk barang massal (kursi, ATK)."
                checked={modePelacakan === "batch"}
                onChange={setModePelacakan}
              />
              <ModeOption
                name="modePelacakan"
                value="unit"
                title="Per-Unit"
                description="Tiap unit fisik dapat identitas & QR Code sendiri. Cocok untuk barang krusial (laptop, elektronik)."
                checked={modePelacakan === "unit"}
                onChange={setModePelacakan}
              />
            </div>
          )}
        </Panel>

        <Panel title="Lokasi" subtitle="(Gedung → Lantai → Ruang → Sub-lokasi)">
          <LocationCascadeFields gedungList={gedungList} initial={initialData?.lokasi} />
          {isUnitMode && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-dim">
              <Info size={13} />
              Lokasi ini jadi lokasi awal tiap unit — bisa diubah per unit belakangan di halaman Detail Barang.
            </p>
          )}
        </Panel>

        {isUnitMode ? (
          isEdit ? (
            <>
              <input type="hidden" name="jumlahUnit" value={initialData.jumlahUnit} />
              <input type="hidden" name="jumlahBaik" value={initialData.jumlahBaik} />
              <input type="hidden" name="jumlahRusakRingan" value={initialData.jumlahRusakRingan} />
              <input type="hidden" name="jumlahRusakBerat" value={initialData.jumlahRusakBerat} />
            </>
          ) : (
            <Panel title="Jumlah Unit Awal">
              <NumberField
                label="Jumlah Unit"
                name="jumlahUnit"
                value={jumlahUnit}
                onChange={setJumlahUnit}
                className="max-w-40 font-semibold"
              />
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-dim">
                <Info size={13} />
                Sistem akan membuat {jumlahUnit || 0} baris unit fisik otomatis, semuanya berkondisi Baik. Kondisi
                tiap unit bisa diubah belakangan di halaman Detail Barang.
              </p>
            </Panel>
          )
        ) : (
          <Panel
            title="Jumlah & Kondisi"
            headerExtra={
              <span
                className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  totalCocok ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
                }`}
              >
                {totalCocok && <Check size={13} />}
                Total {totalCocok ? "cocok" : "belum cocok"}: {totalKondisi} {totalCocok ? "=" : "≠"} {jumlahUnit}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumberField
                label="Jumlah Unit"
                name="jumlahUnit"
                value={jumlahUnit}
                onChange={setJumlahUnit}
                className="font-semibold"
              />
              <NumberField label="Baik" name="jumlahBaik" value={jumlahBaik} onChange={setJumlahBaik} tone="good" />
              <NumberField
                label="Rusak Ringan"
                name="jumlahRusakRingan"
                value={jumlahRusakRingan}
                onChange={setJumlahRusakRingan}
                tone="warn"
              />
              <NumberField
                label="Rusak Berat"
                name="jumlahRusakBerat"
                value={jumlahRusakBerat}
                onChange={setJumlahRusakBerat}
                tone="danger"
              />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-dim">
              <Info size={13} />
              Jumlah Baik + Rusak Ringan + Rusak Berat harus sama dengan Jumlah Unit.
            </p>
          </Panel>
        )}
      </div>

      <Panel title="Foto Kondisi">
        {initialData && initialData.existingPhotos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {initialData.existingPhotos.map((foto) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto.id}
                src={foto.path}
                alt="Foto kondisi tersimpan"
                className="size-14 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
        <PhotoUploadField />
        {isEdit && <p className="mt-2 text-[11px] text-dim">Foto baru akan ditambahkan, foto lama tetap tersimpan.</p>}
      </Panel>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-5.5 flex items-center gap-3 border-t border-border bg-surface px-6 py-4">
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
            {isPending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Barang"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Panel({
  title,
  subtitle,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center">
        <h3 className="text-sm font-semibold text-text">
          {title}
          {subtitle && <span className="ml-1.5 text-xs font-normal text-dim">{subtitle}</span>}
        </h3>
        {headerExtra}
      </div>
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
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}

function ModeOption({
  name,
  value,
  title,
  description,
  checked,
  onChange,
}: {
  name: string;
  value: "batch" | "unit";
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: "batch" | "unit") => void;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3.5 transition-colors ${
        checked ? "border-accent-strong bg-accent-soft/40" : "border-border hover:border-muted"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="accent-accent-strong"
        />
        <span className="text-sm font-semibold text-text">{title}</span>
      </span>
      <span className="text-[11px] text-dim">{description}</span>
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  tone,
  className,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  tone?: "good" | "warn" | "danger";
  className?: string;
}) {
  const toneClass = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-muted";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={`text-xs font-medium ${toneClass}`}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={0}
        required
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(event.target.valueAsNumber || 0)}
        className={`rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent ${className ?? ""}`}
      />
    </div>
  );
}
