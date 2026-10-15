"use client";

import { useState } from "react";
import { Buildings, Printer } from "@phosphor-icons/react";

function hariIniJakarta() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Cetak KIR seluruh ruang (atau satu gedung) dalam satu PDF di tab baru. */
export function CetakSemuaKirForm({ gedungOptions }: { gedungOptions: { id: string; nama: string }[] }) {
  const [tanggal, setTanggal] = useState(hariIniJakarta);

  return (
    <form
      action="/api/kir"
      method="get"
      target="_blank"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-none">
        <label htmlFor="kir-gedungId" className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Buildings size={13} />
          Gedung
        </label>
        <select
          id="kir-gedungId"
          name="gedungId"
          defaultValue=""
          className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        >
          <option value="">Semua gedung</option>
          {gedungOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kir-semua-tanggal" className="text-xs font-medium text-muted">
          Tanggal dokumen
        </label>
        <input
          id="kir-semua-tanggal"
          name="tanggal"
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
        <Printer size={16} />
        Cetak semua KIR
      </button>
      <p className="w-full text-[11px] text-dim">Satu PDF, satu ruang per halaman — untuk awal tahun ajaran atau audit.</p>
    </form>
  );
}
