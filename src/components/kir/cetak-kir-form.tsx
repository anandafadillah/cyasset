"use client";

import { useState } from "react";
import { FilePdf } from "@phosphor-icons/react";

function hariIniJakarta() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/**
 * Pilih ruang (bila `ruangOptions` diberikan) + tanggal dokumen, lalu buka PDF
 * KIR di tab baru. Dengan `ruangId` tetap, pilihan ruang disembunyikan.
 */
export function CetakKirForm({
  ruangOptions,
  ruangId: ruangIdTetap,
  compact = false,
}: {
  ruangOptions?: { id: string; label: string }[];
  ruangId?: string;
  compact?: boolean;
}) {
  const [ruangId, setRuangId] = useState(ruangIdTetap ?? "");
  const [tanggal, setTanggal] = useState(hariIniJakarta);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ruangId) return;
    window.open(`/api/kir/${ruangId}?tanggal=${encodeURIComponent(tanggal)}`, "_blank", "noopener");
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? "flex-wrap items-end" : "flex-col"}`}>
      {ruangOptions && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="kir-ruangId" className="text-xs font-medium text-muted">
            Ruang
          </label>
          <select
            id="kir-ruangId"
            required
            value={ruangId}
            onChange={(event) => setRuangId(event.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          >
            <option value="">Pilih ruang…</option>
            {ruangOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`kir-tanggal-${ruangIdTetap ?? "pilih"}`} className="text-xs font-medium text-muted">
          Tanggal dokumen
        </label>
        <input
          id={`kir-tanggal-${ruangIdTetap ?? "pilih"}`}
          type="date"
          required
          value={tanggal}
          onChange={(event) => setTanggal(event.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <FilePdf size={16} />
        Cetak KIR (PDF)
      </button>
    </form>
  );
}
