"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, PencilSimple, QrCode, X } from "@phosphor-icons/react";
import { updateBarangUnitAction } from "@/app/(app)/barang/unit-actions";
import type { GedungNode } from "@/components/lokasi/location-explorer";
import { LocationCascadeFields, type LocationCascadeInitial } from "@/components/barang/location-cascade-fields";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

export type BarangUnitRow = {
  id: string;
  subKode: string;
  nomorSeri: string | null;
  kondisi: "baik" | "rusak_ringan" | "rusak_berat" | "hilang" | "diganti";
  catatan: string | null;
  lokasi: LocationCascadeInitial;
  lokasiLabel: string;
  foto: { id: string; path: string }[];
  sedangDipinjam: boolean;
};

const kondisiLabel: Record<BarangUnitRow["kondisi"], { label: string; className: string }> = {
  baik: { label: "Baik", className: "bg-good-soft text-good" },
  rusak_ringan: { label: "Rusak Ringan", className: "bg-warn-soft text-warn" },
  rusak_berat: { label: "Rusak Berat", className: "bg-danger-soft text-danger" },
  hilang: { label: "Hilang", className: "bg-surface-3 text-muted" },
  diganti: { label: "Diganti (nonaktif)", className: "bg-surface-3 text-faint" },
};

export function BarangUnitList({
  barangId,
  units,
  gedungList,
}: {
  barangId: string;
  units: BarangUnitRow[];
  gedungList: GedungNode[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-dim">
              <th className="py-2.5 pl-4.5 font-medium">Sub-kode</th>
              <th className="py-2.5 font-medium">Nomor Seri</th>
              <th className="py-2.5 font-medium">Kondisi</th>
              <th className="py-2.5 font-medium">Lokasi</th>
              <th className="py-2.5 font-medium">Foto</th>
              <th className="py-2.5 pr-4.5" />
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <UnitRow
                key={unit.id}
                barangId={barangId}
                unit={unit}
                gedungList={gedungList}
                isEditing={editingId === unit.id}
                onEdit={() => setEditingId(unit.id)}
                onClose={() => setEditingId(null)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UnitRow({
  barangId,
  unit,
  gedungList,
  isEditing,
  onEdit,
  onClose,
}: {
  barangId: string;
  unit: BarangUnitRow;
  gedungList: GedungNode[];
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isNonaktif = unit.kondisi === "diganti";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateBarangUnitAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const tone = kondisiLabel[unit.kondisi];

  return (
    <>
      <tr className={`border-t border-border ${isNonaktif ? "opacity-60" : ""}`}>
        <td className="py-2.5 pl-4.5 font-mono text-xs text-text">{unit.subKode}</td>
        <td className="py-2.5 text-text">{unit.nomorSeri || "—"}</td>
        <td className="py-2.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone.className}`}>{tone.label}</span>
          {unit.sedangDipinjam && (
            <span className="ml-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              Dipinjam
            </span>
          )}
        </td>
        <td className="py-2.5 text-text">{unit.lokasiLabel}</td>
        <td className="py-2.5 text-text">{unit.foto.length}</td>
        <td className="py-2.5 pr-4.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {!isNonaktif && (
              <Link
                href={`/barang/${barangId}/cetak-qr?unit=${unit.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:text-text"
              >
                <QrCode size={13} />
                QR
              </Link>
            )}
            {!isNonaktif && (
              <button
                type="button"
                onClick={isEditing ? onClose : onEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:text-text"
              >
                {isEditing ? <X size={13} /> : <PencilSimple size={13} />}
                {isEditing ? "Batal" : "Edit"}
              </button>
            )}
          </div>
        </td>
      </tr>
      {isEditing && (
        <tr className="border-t border-border bg-surface-2">
          <td colSpan={6} className="p-4.5">
            <form action={handleSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="unitId" value={unit.id} />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <TextField label="Nomor Seri" name="nomorSeri" defaultValue={unit.nomorSeri ?? undefined} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">Kondisi</label>
                  <select
                    name="kondisi"
                    defaultValue={unit.kondisi}
                    className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                    <option value="hilang">Hilang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Lokasi (Gedung → Lantai → Ruang → Sub-lokasi)
                </label>
                <LocationCascadeFields gedungList={gedungList} initial={unit.lokasi} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Catatan</label>
                <textarea
                  name="catatan"
                  rows={2}
                  defaultValue={unit.catatan ?? undefined}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Foto Unit</label>
                {unit.foto.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {unit.foto.map((foto) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={foto.id}
                        src={foto.path}
                        alt={`Foto ${unit.subKode}`}
                        className="size-14 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
                <PhotoUploadField />
              </div>

              <div className="flex items-center gap-3">
                <div aria-live="polite" className="text-xs text-danger">
                  {error}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted hover:text-text"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-strong px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Check size={13} weight="bold" />
                    {isPending ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function TextField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}
