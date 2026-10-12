"use client";

import { useId } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SortAscending, SortDescending } from "@phosphor-icons/react";

export function ResponsiveTableSort({ options, value, direction }: {
  options: { value: string; label: string }[];
  value: string | null;
  direction: "asc" | "desc";
}) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(sort: string, dir: "asc" | "desc") {
    const params = new URLSearchParams(searchParams.toString());
    if (sort) { params.set("sort", sort); params.set("dir", dir); }
    else { params.delete("sort"); params.delete("dir"); }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm lg:hidden">
      <label htmlFor={id} className="text-muted">Urutkan</label>
      <select id={id} value={value ?? ""} onChange={(event) => update(event.target.value, "asc")} className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-text">
        <option value="">Urutan awal</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button type="button" disabled={!value} onClick={() => update(value ?? "", direction === "asc" ? "desc" : "asc")} aria-label={direction === "asc" ? "Ubah ke urutan menurun" : "Ubah ke urutan menaik"} className="grid size-11 place-items-center rounded-lg border border-border bg-surface text-muted disabled:opacity-40">
        {direction === "asc" ? <SortAscending size={20} /> : <SortDescending size={20} />}
      </button>
    </div>
  );
}
