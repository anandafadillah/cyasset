"use client";

import { useMemo, useState } from "react";
import { CaretDown, DesktopTower } from "@phosphor-icons/react";

export type BarangPickerOption =
  | { id: string; nama: string; kode: string; modePelacakan: "batch"; jumlahBaik: number }
  | { id: string; nama: string; kode: string; modePelacakan: "unit"; units: { id: string; subKode: string }[] };

export function BarangPicker({
  options,
  value,
  onChange,
}: {
  options: BarangPickerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) => option.nama.toLowerCase().includes(q) || option.kode.toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <div className="relative">
      <input type="hidden" name="barangId" value={value} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-left text-sm text-text outline-none focus:border-accent"
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <DesktopTower size={15} className="flex-none text-muted" />
            <span className="truncate">{selected.nama}</span>
            <span className="flex-none text-xs text-dim">{selected.kode}</span>
          </span>
        ) : (
          <span className="flex-1 text-dim">Pilih barang…</span>
        )}
        <CaretDown size={14} className="flex-none text-dim" />
      </button>

      {open && (
        <div className="absolute left-0 z-10 mt-1.5 w-full rounded-lg border border-border bg-surface-2 p-2 shadow-xl">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau kode barang…"
            className="mb-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text outline-none focus:border-accent"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-dim">Barang tidak ditemukan.</div>
            )}
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-text hover:bg-white/5"
              >
                <span className="truncate">
                  {option.nama} <span className="text-dim">· {option.kode}</span>
                </span>
                <span className="ml-2 flex-none text-xs text-dim">
                  {option.modePelacakan === "batch" ? `${option.jumlahBaik} baik` : `${option.units.length} unit baik`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
