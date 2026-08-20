"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "@phosphor-icons/react";
import { archiveBarangAction } from "@/app/(app)/barang/actions";

export function ArchiveBarangButton({ id, nama }: { id: string; nama: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    if (!confirm(`Arsipkan "${nama}"? Barang tidak akan muncul lagi di Daftar Barang.`)) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      await archiveBarangAction(null, formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-text disabled:opacity-60"
    >
      <Archive size={16} />
      {isPending ? "Mengarsipkan…" : "Arsipkan"}
    </button>
  );
}
