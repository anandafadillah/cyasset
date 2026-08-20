"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function TopbarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!q.trim()) return;
    router.push(`/barang?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden w-70 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:flex"
    >
      <MagnifyingGlass size={16} className="text-dim" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Cari barang…"
        className="w-full bg-transparent text-text outline-none placeholder:text-dim"
      />
    </form>
  );
}
