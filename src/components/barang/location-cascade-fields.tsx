"use client";

import { useState } from "react";
import type { GedungNode, LantaiNode, RuangNode, SubLokasiNode } from "@/components/lokasi/location-explorer";

type Option = { id: string; nama: string };

export type LocationCascadeInitial = {
  ruangId: string;
  subLokasiId: string;
};

/** Barang hanya menyimpan ruangId/subLokasiId — telusuri pohon lokasi untuk cari Gedung & Lantai induknya. */
function resolveInitialPath(gedungList: GedungNode[], ruangId: string) {
  for (const g of gedungList) {
    for (const l of g.lantai) {
      if (l.ruang.some((r) => r.id === ruangId)) {
        return { gedungId: g.id, lantaiId: l.id };
      }
    }
  }
  return { gedungId: "", lantaiId: "" };
}

export function LocationCascadeFields({
  gedungList,
  initial,
}: {
  gedungList: GedungNode[];
  initial?: LocationCascadeInitial;
}) {
  const resolved = resolveInitialPath(gedungList, initial?.ruangId ?? "");
  const [gedungId, setGedungId] = useState(resolved.gedungId);
  const [lantaiId, setLantaiId] = useState(resolved.lantaiId);
  const [ruangId, setRuangId] = useState(initial?.ruangId ?? "");
  const [subLokasiId, setSubLokasiId] = useState(initial?.subLokasiId ?? "");

  const lantaiOptions: LantaiNode[] = gedungList.find((g) => g.id === gedungId)?.lantai ?? [];
  const ruangOptions: RuangNode[] = lantaiOptions.find((l) => l.id === lantaiId)?.ruang ?? [];
  const subLokasiOptions: SubLokasiNode[] = ruangOptions.find((r) => r.id === ruangId)?.subLokasi ?? [];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SelectField
        label="Gedung"
        value={gedungId}
        placeholder="Pilih Gedung"
        options={gedungList}
        onChange={(value) => {
          setGedungId(value);
          setLantaiId("");
          setRuangId("");
          setSubLokasiId("");
        }}
      />
      <SelectField
        label="Lantai"
        value={lantaiId}
        placeholder="Pilih Lantai"
        options={lantaiOptions}
        disabled={!gedungId}
        onChange={(value) => {
          setLantaiId(value);
          setRuangId("");
          setSubLokasiId("");
        }}
      />
      <SelectField
        label="Ruang"
        value={ruangId}
        placeholder="Pilih Ruang"
        options={ruangOptions}
        disabled={!lantaiId}
        onChange={(value) => {
          setRuangId(value);
          setSubLokasiId("");
        }}
      />
      <SelectField
        label="Sub-lokasi (opsional)"
        value={subLokasiId}
        placeholder="—"
        options={subLokasiOptions}
        disabled={!ruangId}
        onChange={setSubLokasiId}
      />
      <input type="hidden" name="ruangId" value={ruangId} />
      <input type="hidden" name="subLokasiId" value={subLokasiId} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.nama}
          </option>
        ))}
      </select>
    </div>
  );
}
