"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarBlank, MagnifyingGlass, Money, Wrench } from "@phosphor-icons/react";

const tabs = [
  { value: "semua", label: "Semua" },
  { value: "direncanakan", label: "Direncanakan" },
  { value: "proses", label: "Proses" },
  { value: "selesai", label: "Selesai" },
] as const;

const jenisOptions = [
  { value: "", label: "Jenis: Semua" },
  { value: "pembangunan_baru", label: "Pembangunan Baru" },
  { value: "perbaikan", label: "Perbaikan" },
  { value: "pemeliharaan", label: "Pemeliharaan" },
];

const sumberDanaOptions = [
  { value: "", label: "Sumber Dana: Semua" },
  { value: "ssg", label: "SSG" },
  { value: "bos", label: "BOS" },
  { value: "komite_sekolah", label: "Komite Sekolah" },
  { value: "mandiri_yayasan", label: "Mandiri Yayasan" },
  { value: "lainnya", label: "Lainnya" },
];

export function PrasaranaFilterBar({
  activeTab,
  counts,
}: {
  activeTab: string;
  counts: { semua: number; direncanakan: number; proses: number; selesai: number };
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
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-1.5 border-b border-border">
        {tabs.map((tab) => {
          const active = activeTab === tab.value;
          const params = new URLSearchParams(searchParams.toString());
          if (tab.value === "semua") params.delete("tab");
          else params.set("tab", tab.value);
          return (
            <a
              key={tab.value}
              href={`${pathname}?${params.toString()}`}
              className={`mr-2 border-b-2 px-1 py-2.5 text-sm font-medium ${
                active ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"
              }`}
            >
              {tab.label} <span className="text-dim">{counts[tab.value]}</span>
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex w-75 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <MagnifyingGlass size={16} className="text-dim" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Cari nama pekerjaan atau lokasi…"
            className="w-full bg-transparent text-text outline-none placeholder:text-dim"
          />
        </div>

        <FilterSelect
          icon={<Wrench size={15} className="text-muted" />}
          value={searchParams.get("jenis") ?? ""}
          onChange={(value) => updateParam("jenis", value)}
          options={jenisOptions}
        />

        <FilterSelect
          icon={<Money size={15} className="text-muted" />}
          value={searchParams.get("sumberDana") ?? ""}
          onChange={(value) => updateParam("sumberDana", value)}
          options={sumberDanaOptions}
        />

        <DateRangeFilter
          icon={<CalendarBlank size={15} className="text-muted" />}
          label="Tanggal Mulai"
          dari={searchParams.get("dari") ?? ""}
          sampai={searchParams.get("sampai") ?? ""}
          onChangeDari={(value) => updateParam("dari", value)}
          onChangeSampai={(value) => updateParam("sampai", value)}
        />
      </div>
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
