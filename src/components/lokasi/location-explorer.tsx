"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Buildings,
  CaretDown,
  CaretRight,
  DoorOpen,
  DotsThreeOutline,
  FileText,
  PencilSimple,
  Plus,
  Stack,
  Trash,
} from "@phosphor-icons/react";
import { LocationFormDialog, type LocationDialogTarget } from "./location-form-dialog";
import { deleteLocationAction, type LocationLevel } from "@/app/(app)/lokasi/actions";
import { Topbar } from "@/components/layout/topbar";

export type SubLokasiNode = { id: string; nama: string };
export type RuangNode = {
  id: string;
  nama: string;
  kode: string | null;
  penanggungJawabNama: string | null;
  penanggungJawabNip: string | null;
  subLokasi: SubLokasiNode[];
  totalUnit: number;
  jenisBarang: number;
};
export type LantaiNode = { id: string; nama: string; ruang: RuangNode[] };
export type GedungNode = { id: string; nama: string; lantai: LantaiNode[] };

export function LocationExplorer({
  gedungList,
  breadcrumb,
}: {
  gedungList: GedungNode[];
  breadcrumb: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(gedungList[0] ? [gedungList[0].id] : []));
  const [selected, setSelected] = useState<{ ruang: RuangNode; gedungNama: string; lantaiNama: string } | null>(
    null,
  );
  const [dialogTarget, setDialogTarget] = useState<LocationDialogTarget | null>(null);
  const [, startTransition] = useTransition();

  // Ambil ulang dari gedungList terbaru (bukan snapshot saat diklik) supaya
  // panel detail ikut berubah setelah ruangnya diedit.
  const selectedView = selected
    ? gedungList
        .flatMap((g) => g.lantai.flatMap((l) => l.ruang.map((ruang) => ({ ruang, gedungNama: g.nama, lantaiNama: l.nama }))))
        .find((item) => item.ruang.id === selected.ruang.id) ?? null
    : null;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(level: LocationLevel, id: string, nama: string) {
    if (!confirm(`Hapus "${nama}"? Seluruh data di dalamnya (jika ada) ikut terhapus.`)) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("level", level);
      formData.set("id", id);
      await deleteLocationAction(null, formData);
      setSelected((current) => (current?.ruang.id === id ? null : current));
    });
  }

  return (
    <>
      <Topbar
        title="Lokasi"
        breadcrumb={breadcrumb}
        actions={
          <button
            type="button"
            onClick={() => setDialogTarget({ level: "gedung", mode: "create" })}
            className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} weight="bold" />
            Tambah Gedung
          </button>
        }
      />
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        <div className="location-tree min-w-0 rounded-xl border border-border bg-surface p-2">
          {gedungList.length === 0 && (
            <div className="p-6 text-center text-sm text-dim">Belum ada data Gedung.</div>
          )}
          {gedungList.map((g) => {
            const isOpen = expanded.has(g.id);
            const totalUnitGedung = g.lantai.reduce(
              (sum, l) => sum + l.ruang.reduce((rSum, r) => rSum + r.totalUnit, 0),
              0,
            );
            return (
              <div key={g.id}>
                <div className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-white/5">
                  <button
                    type="button"
                    onClick={() => toggle(g.id)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                  >
                    {isOpen ? (
                      <CaretDown size={14} className="text-dim" />
                    ) : (
                      <CaretRight size={14} className="text-dim" />
                    )}
                    <Buildings size={18} className="text-accent" />
                    <span className="text-sm font-medium text-text">{g.nama}</span>
                  </button>
                  <span className="text-[11px] text-dim">
                    {g.lantai.length} lantai · {totalUnitGedung} unit
                  </span>
                  <RowActions
                    onAdd={() => setDialogTarget({ level: "lantai", mode: "create", parentId: g.id })}
                    onEdit={() => setDialogTarget({ level: "gedung", mode: "edit", id: g.id, initialNama: g.nama })}
                    onDelete={() => handleDelete("gedung", g.id, g.nama)}
                    addLabel="Tambah Lantai"
                  />
                </div>

                {isOpen && (
                  <div className="ml-5.5 border-l border-border pl-2">
                    {g.lantai.map((l) => {
                      const lantaiOpen = expanded.has(l.id);
                      return (
                        <div key={l.id}>
                          <div className="group flex items-center gap-2.5 rounded-lg px-3 py-1.75 hover:bg-white/5">
                            <button
                              type="button"
                              onClick={() => toggle(l.id)}
                              className="flex flex-1 items-center gap-2.5 text-left"
                            >
                              {lantaiOpen ? (
                                <CaretDown size={13} className="text-dim" />
                              ) : (
                                <CaretRight size={13} className="text-dim" />
                              )}
                              <Stack size={16} className="text-muted" />
                              <span className="text-[13px] text-text">{l.nama}</span>
                            </button>
                            <span className="text-[11px] text-dim">{l.ruang.length} ruang</span>
                            <RowActions
                              onAdd={() => setDialogTarget({ level: "ruang", mode: "create", parentId: l.id })}
                              onEdit={() =>
                                setDialogTarget({ level: "lantai", mode: "edit", id: l.id, initialNama: l.nama })
                              }
                              onDelete={() => handleDelete("lantai", l.id, l.nama)}
                              addLabel="Tambah Ruang"
                            />
                          </div>

                          {lantaiOpen && (
                            <div className="ml-5.25 border-l border-border pl-2">
                              {l.ruang.map((r) => {
                                const isSelected = selected?.ruang.id === r.id;
                                return (
                                  <div key={r.id}>
                                    <div
                                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-1.5 ${
                                        isSelected ? "bg-accent-soft" : "hover:bg-white/5"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelected({ ruang: r, gedungNama: g.nama, lantaiNama: l.nama })
                                        }
                                        className="flex flex-1 items-center gap-2.5 text-left"
                                      >
                                        <DoorOpen
                                          size={15}
                                          className={isSelected ? "text-accent" : "text-muted"}
                                        />
                                        <span className={`text-[13px] ${isSelected ? "text-accent" : "text-text"}`}>
                                          {r.nama}
                                          {r.kode && <span className="ml-1.5 text-[11px] text-dim">{r.kode}</span>}
                                        </span>
                                      </button>
                                      <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-dim">
                                        {r.totalUnit} unit
                                      </span>
                                      <RowActions
                                        onAdd={() =>
                                          setDialogTarget({ level: "sub-lokasi", mode: "create", parentId: r.id })
                                        }
                                        onEdit={() =>
                                          setDialogTarget(ruangEditTarget(r))
                                        }
                                        onDelete={() => handleDelete("ruang", r.id, r.nama)}
                                        addLabel="Tambah Sub-lokasi"
                                      />
                                    </div>
                                    {r.subLokasi.map((s) => (
                                      <div
                                        key={s.id}
                                        className="group flex items-center gap-2.5 py-1.25 pl-8.5 hover:bg-white/5"
                                      >
                                        <span className="flex-1 text-xs text-muted">
                                          {s.nama} <span className="text-faint">(sub-lokasi)</span>
                                        </span>
                                        <RowActions
                                          onEdit={() =>
                                            setDialogTarget({
                                              level: "sub-lokasi",
                                              mode: "edit",
                                              id: s.id,
                                              initialNama: s.nama,
                                            })
                                          }
                                          onDelete={() => handleDelete("sub-lokasi", s.id, s.nama)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          {selectedView ? (
            <>
              <div className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-accent uppercase">
                Ruang terpilih
              </div>
              <h3 className="text-[17px] font-semibold text-text">{selectedView.ruang.nama}</h3>
              <div className="mb-4 text-xs text-dim">
                {selectedView.gedungNama} · {selectedView.lantaiNama}
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex">
                  <span className="text-muted">Kode ruang</span>
                  <span className="ml-auto text-text">{selectedView.ruang.kode ?? "—"}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-muted">Penanggung jawab</span>
                  <span className="ml-auto text-right text-text">
                    {selectedView.ruang.penanggungJawabNama ?? "—"}
                    {selectedView.ruang.penanggungJawabNip && (
                      <span className="block text-[11px] text-dim">NIP. {selectedView.ruang.penanggungJawabNip}</span>
                    )}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-muted">Total unit</span>
                  <span className="ml-auto font-semibold text-text">{selectedView.ruang.totalUnit}</span>
                </div>
                <div className="flex">
                  <span className="text-muted">Jenis barang</span>
                  <span className="ml-auto text-text">{selectedView.ruang.jenisBarang}</span>
                </div>
                <div className="flex">
                  <span className="text-muted">Sub-lokasi</span>
                  <span className="ml-auto text-right text-text">
                    {selectedView.ruang.subLokasi.length > 0
                      ? `${selectedView.ruang.subLokasi.length} (${selectedView.ruang.subLokasi.map((s) => s.nama).join(", ")})`
                      : "Tidak ada"}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDialogTarget(ruangEditTarget(selectedView.ruang))
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted hover:text-text"
                >
                  <PencilSimple size={14} /> Edit
                </button>
                <Link
                  href={`/kir/${selectedView.ruang.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted hover:text-text"
                >
                  <FileText size={14} /> Lihat KIR
                </Link>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-dim">Pilih sebuah Ruang untuk melihat detailnya.</div>
          )}
        </div>
      </div>

      <LocationFormDialog target={dialogTarget} onClose={() => setDialogTarget(null)} />
    </>
  );
}

function ruangEditTarget(r: RuangNode): LocationDialogTarget {
  return {
    level: "ruang",
    mode: "edit",
    id: r.id,
    initialNama: r.nama,
    initialRuang: { kode: r.kode, penanggungJawabNama: r.penanggungJawabNama, penanggungJawabNip: r.penanggungJawabNip },
  };
}

function RowActions({
  onAdd,
  onEdit,
  onDelete,
  addLabel,
}: {
  onAdd?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  addLabel?: string;
}) {
  return (
    <>
    <details className="location-touch-actions relative shrink-0 xl:hidden">
      <summary aria-label="Tindakan lokasi" className="grid size-11 cursor-pointer list-none place-items-center rounded-lg text-muted hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <DotsThreeOutline size={20} />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface-2 p-1 shadow-xl">
        {onAdd && <button type="button" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); onAdd(); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text"><Plus size={16} />{addLabel}</button>}
        <button type="button" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); onEdit(); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text"><PencilSimple size={16} />Ubah</button>
        <button type="button" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); onDelete(); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-danger"><Trash size={16} />Hapus</button>
      </div>
    </details>
    <div className="location-desktop-actions hidden items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 xl:flex">
      {onAdd && (
        <button
          type="button"
          title={addLabel}
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className="grid size-6.5 place-items-center rounded-md text-dim hover:bg-white/10 hover:text-text"
        >
          <Plus size={13} />
        </button>
      )}
      <button
        type="button"
        title="Ubah"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="grid size-6.5 place-items-center rounded-md text-dim hover:bg-white/10 hover:text-text"
      >
        <PencilSimple size={13} />
      </button>
      <button
        type="button"
        title="Hapus"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="grid size-6.5 place-items-center rounded-md text-dim hover:bg-danger-soft hover:text-danger"
      >
        <Trash size={13} />
      </button>
    </div>
    </>
  );
}
