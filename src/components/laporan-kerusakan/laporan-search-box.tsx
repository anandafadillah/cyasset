"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function LaporanSearchBox() {
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
    <div className="flex w-55 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <MagnifyingGlass size={15} className="text-dim" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Cari tiket…"
        className="w-full bg-transparent text-text outline-none placeholder:text-dim"
      />
    </div>
  );
}
