"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarBlank, MagnifyingGlass, MapPin, Pulse, Tag } from "@phosphor-icons/react";

export type LokasiOption = { id: string; label: string };

const kondisiOptions = [
  { value: "", label: "Semua" },
  { value: "rusak-ringan", label: "Ada Rusak Ringan" },
  { value: "rusak-berat", label: "Ada Rusak Berat" },
  { value: "baik-semua", label: "Baik Semua" },
];

export function BarangFilters({
  kategoriOptions,
  lokasiOptions,
}: {
  kategoriOptions: string[];
  lokasiOptions: LokasiOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const isFirstRender = useRef(true);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => updateParam("q", q), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex w-75 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <MagnifyingGlass size={16} className="text-dim" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cari nama, kode, atau merk…"
          className="w-full bg-transparent text-text outline-none placeholder:text-dim"
        />
      </div>

      <FilterSelect
        icon={<Tag size={15} className="text-muted" />}
        value={searchParams.get("kategori") ?? ""}
        onChange={(value) => updateParam("kategori", value)}
        options={[{ value: "", label: "Kategori: Semua" }, ...kategoriOptions.map((k) => ({ value: k, label: k }))]}
      />

      <FilterSelect
        icon={<MapPin size={15} className="text-muted" />}
        value={searchParams.get("lokasi") ?? ""}
        onChange={(value) => updateParam("lokasi", value)}
        options={[
          { value: "", label: "Lokasi: Semua" },
          ...lokasiOptions.map((l) => ({ value: l.id, label: l.label })),
        ]}
      />

      <FilterSelect
        icon={<Pulse size={15} className="text-muted" />}
        value={searchParams.get("kondisi") ?? ""}
        onChange={(value) => updateParam("kondisi", value)}
        options={kondisiOptions.map((option) => ({
          value: option.value,
          label: option.value === "" ? "Kondisi: Semua" : option.label,
        }))}
      />

      <DateRangeFilter
        icon={<CalendarBlank size={15} className="text-muted" />}
        label="Tanggal Masuk"
        dari={searchParams.get("dari") ?? ""}
        sampai={searchParams.get("sampai") ?? ""}
        onChangeDari={(value) => updateParam("dari", value)}
        onChangeSampai={(value) => updateParam("sampai", value)}
      />
    </div>
  );
}

function DateRangeFilter({
  icon,
  label,
  dari,
  sampai,
  onChangeDari,
  onChangeSampai,
}: {
  icon: React.ReactNode;
  label: string;
  dari: string;
  sampai: string;
  onChangeDari: (value: string) => void;
  onChangeSampai: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
      {icon}
      <span className="text-dim">{label}:</span>
      <input
        type="date"
        value={dari}
        onChange={(event) => onChangeDari(event.target.value)}
        className="bg-transparent outline-none"
      />
      <span className="text-dim">–</span>
      <input
        type="date"
        value={sampai}
        onChange={(event) => onChangeSampai(event.target.value)}
        className="bg-transparent outline-none"
      />
    </div>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
      {icon}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent outline-none"
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
