"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function TopbarSearch({ className = "w-full", onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!q.trim()) return;
    router.push(`/barang?q=${encodeURIComponent(q.trim())}`);
    onNavigate?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm ${className}`}
    >
      <MagnifyingGlass size={16} className="text-dim" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Cari barang…"
        aria-label="Cari barang"
        className="w-full bg-transparent text-text outline-none placeholder:text-dim"
      />
    </form>
  );
}
