"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

const tabs = [
  { value: "semua", label: "Semua" },
  { value: "internal", label: "Internal" },
  { value: "eksternal", label: "Eksternal" },
  { value: "terlambat", label: "Terlambat" },
] as const;

export function PeminjamanFilterBar({
  activeTab,
  counts,
}: {
  activeTab: string;
  counts: { semua: number; internal: number; eksternal: number; terlambat: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border">
      {tabs.map((tab) => {
        const active = activeTab === tab.value;
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value === "semua") params.delete("tab");
        else params.set("tab", tab.value);
        return (
          <a
            key={tab.value}
            href={`${pathname}?${params.toString()}`}
            aria-current={active ? "page" : undefined}
            className={`mr-1 inline-flex min-h-11 shrink-0 items-center gap-1 border-b-2 px-1 py-2.5 text-sm font-medium sm:mr-2 ${
              active
                ? tab.value === "terlambat"
                  ? "border-danger text-danger"
                  : "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {tab.label} <span className="text-dim">{counts[tab.value]}</span>
          </a>
        );
      })}

      <div className="mb-2 flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm md:ml-auto md:w-60">
        <MagnifyingGlass size={15} className="text-dim" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Cari peminjam / barang…"
          aria-label="Cari peminjam atau barang"
          className="w-full bg-transparent text-text outline-none placeholder:text-dim"
        />
      </div>
    </div>
  );
}
