"use client";

import { useMemo, useRef, useState } from "react";
import { DesktopTower, Plus, Trash } from "@phosphor-icons/react";

export type BarangOption =
  | { id: string; nama: string; kode: string; modePelacakan: "batch"; tersedia: number }
  | {
      id: string;
      nama: string;
      kode: string;
      modePelacakan: "unit";
      units: { id: string; subKode: string }[];
    };

type SelectedItem = { barangId: string; jumlah: number } | { barangId: string; barangUnitId: string };

export function PeminjamanItemPicker({ barangOptions }: { barangOptions: BarangOption[] }) {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unitPickerFor, setUnitPickerFor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBatchIds = new Set(selected.filter((item) => "jumlah" in item).map((item) => item.barangId));
  const selectedUnitIds = new Set(
    selected.filter((item): item is { barangId: string; barangUnitId: string } => "barangUnitId" in item).map((item) => item.barangUnitId),
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return barangOptions.filter((option) => {
      if (option.modePelacakan === "batch" && selectedBatchIds.has(option.id)) return false;
      if (option.modePelacakan === "unit" && option.units.every((u) => selectedUnitIds.has(u.id))) return false;
      return q === "" || option.nama.toLowerCase().includes(q) || option.kode.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barangOptions, query, selected]);

  function addBatchItem(barangId: string) {
    setSelected((prev) => [...prev, { barangId, jumlah: 1 }]);
    setQuery("");
    setPickerOpen(false);
  }

  function addUnitItem(barangId: string, barangUnitId: string) {
    setSelected((prev) => [...prev, { barangId, barangUnitId }]);
  }

  function updateJumlah(barangId: string, jumlah: number) {
    setSelected((prev) =>
      prev.map((item) => ("jumlah" in item && item.barangId === barangId ? { ...item, jumlah } : item)),
    );
  }

  function removeItem(key: string) {
    setSelected((prev) =>
      prev.filter((item) => ("barangUnitId" in item ? item.barangUnitId !== key : item.barangId !== key)),
    );
  }

  return (
    <div ref={containerRef}>
      <input type="hidden" name="itemsJson" value={JSON.stringify(selected)} />

      <div className="flex flex-col gap-2">
        {selected.map((item) => {
          const option = barangOptions.find((o) => o.id === item.barangId);
          if (!option) return null;
          const unitSubKode =
            "barangUnitId" in item && option.modePelacakan === "unit"
              ? option.units.find((u) => u.id === item.barangUnitId)?.subKode
              : undefined;
          const key = "barangUnitId" in item ? item.barangUnitId : item.barangId;
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
              <span className="grid size-9.5 flex-none place-items-center rounded-lg bg-surface-3 text-muted">
                <DesktopTower size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-text">{option.nama}</div>
                <div className="text-[11px] text-dim">
                  {unitSubKode
                    ? `Unit ${unitSubKode}`
                    : option.modePelacakan === "batch"
                      ? `${option.kode} · tersedia ${option.tersedia}`
                      : option.kode}
                </div>
              </div>
              {"jumlah" in item && option.modePelacakan === "batch" && (
                <input
                  type="number"
                  min={1}
                  max={option.tersedia}
                  value={item.jumlah}
                  onChange={(event) => updateJumlah(item.barangId, Number(event.target.valueAsNumber) || 1)}
                  className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent"
                />
              )}
              <button
                type="button"
                onClick={() => removeItem(key)}
                className="grid size-7 flex-none place-items-center rounded-md text-dim hover:bg-danger-soft hover:text-danger"
              >
                <Trash size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="relative mt-2.5">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
        >
          <Plus size={14} />
          Tambah barang
        </button>

        {pickerOpen && (
          <div className="absolute left-0 z-10 mt-1.5 w-80 rounded-lg border border-border bg-surface-2 p-2 shadow-xl">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau kode barang…"
              className="mb-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text outline-none focus:border-accent"
            />
            <div className="max-h-56 overflow-y-auto">
              {filteredOptions.length === 0 && (
                <div className="px-2 py-3 text-center text-xs text-dim">Tidak ada barang tersedia.</div>
              )}
              {filteredOptions.map((option) =>
                option.modePelacakan === "batch" ? (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => addBatchItem(option.id)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-text hover:bg-white/5"
                  >
                    <span className="truncate">{option.nama}</span>
                    <span className="ml-2 flex-none text-xs text-dim">tersedia {option.tersedia}</span>
                  </button>
                ) : (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setUnitPickerFor(unitPickerFor === option.id ? null : option.id)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-text hover:bg-white/5"
                  >
                    <span className="truncate">{option.nama}</span>
                    <span className="ml-2 flex-none rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                      Per-Unit · {option.units.filter((u) => !selectedUnitIds.has(u.id)).length} unit
                    </span>
                  </button>
                ),
              )}
              {barangOptions
                .filter((o) => o.id === unitPickerFor && o.modePelacakan === "unit")
                .map((option) => {
                  if (option.modePelacakan !== "unit") return null;
                  const available = option.units.filter((u) => !selectedUnitIds.has(u.id));
                  return (
                    <div key={option.id} className="ml-2.5 flex flex-col gap-1 border-l border-border pl-2.5">
                      {available.length === 0 && (
                        <div className="px-2 py-2 text-xs text-dim">Semua unit sudah dipilih.</div>
                      )}
                      {available.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => addUnitItem(option.id, unit.id)}
                          className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs text-text hover:bg-white/5"
                        >
                          <span>Unit {unit.subKode}</span>
                          <Plus size={12} />
                        </button>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
