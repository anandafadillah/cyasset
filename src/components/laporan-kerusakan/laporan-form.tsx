"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { createLaporanAction } from "@/app/(app)/laporan-kerusakan/actions";
import { BarangPicker, type BarangPickerOption } from "@/components/laporan-kerusakan/barang-picker";
import { PhotoUploadField } from "@/components/barang/photo-upload-field";

export function LaporanForm({ barangOptions }: { barangOptions: BarangPickerOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [barangId, setBarangId] = useState("");
  const [barangUnitId, setBarangUnitId] = useState("");

  const selectedBarang = barangOptions.find((option) => option.id === barangId);
  const isUnitMode = selectedBarang?.modePelacakan === "unit";

  function handleBarangChange(id: string) {
    setBarangId(id);
    setBarangUnitId("");
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLaporanAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-4.5">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-text">Tiket Laporan Kerusakan</h3>
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Barang</label>
            <BarangPicker options={barangOptions} value={barangId} onChange={handleBarangChange} />
          </div>

          {isUnitMode && selectedBarang?.modePelacakan === "unit" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Unit</label>
              <select
                name="barangUnitId"
                required
                value={barangUnitId}
                onChange={(event) => setBarangUnitId(event.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
              >
                <option value="">Pilih unit…</option>
                {selectedBarang.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.subKode}
                  </option>
                ))}
              </select>
              <p className="flex items-center gap-1.5 text-[11px] text-dim">
                Barang ini mode Per-Unit — tiket dibuat untuk satu unit fisik spesifik.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deskripsi" className="text-xs font-medium text-muted">
              Deskripsi Keluhan
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              required
              rows={3}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pelapor" className="text-xs font-medium text-muted">
              Dilaporkan oleh <span className="text-dim">(opsional)</span>
            </label>
            <input
              id="pelapor"
              name="pelapor"
              type="text"
              placeholder="mis. Dewi L. (Guru Multimedia)"
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {!isUnitMode && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="jumlahUnitTerdampak" className="text-xs font-medium text-muted">
                  Jumlah Unit Terdampak
                </label>
                <input
                  id="jumlahUnitTerdampak"
                  name="jumlahUnitTerdampak"
                  type="number"
                  min={1}
                  required
                  defaultValue={1}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
                />
              </div>
            )}
            <div className={`flex flex-col gap-1.5 ${isUnitMode ? "col-span-2" : ""}`}>
              <span className="text-xs font-medium text-muted">Tingkat Kerusakan Awal</span>
              <div className="flex items-center gap-4 py-2.5">
                <label className="flex items-center gap-1.5 text-sm text-text">
                  <input type="radio" name="tingkatKerusakan" value="rusak_ringan" required defaultChecked />
                  Rusak Ringan
                </label>
                <label className="flex items-center gap-1.5 text-sm text-text">
                  <input type="radio" name="tingkatKerusakan" value="rusak_berat" required />
                  Rusak Berat
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-text">
          Foto Bukti <span className="text-xs font-normal text-danger">(wajib)</span>
        </h3>
        <PhotoUploadField />
      </div>

      <div className="flex items-center gap-3">
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
            {isPending ? "Menyimpan…" : "Simpan Tiket"}
          </button>
        </div>
      </div>
    </form>
  );
}
