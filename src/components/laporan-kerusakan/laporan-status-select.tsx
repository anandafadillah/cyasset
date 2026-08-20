"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLaporanStatusAction } from "@/app/(app)/laporan-kerusakan/actions";

const statusOptions = [
  { value: "masuk", label: "Masuk" },
  { value: "diproses", label: "Diproses / Diperbaiki" },
  { value: "selesai", label: "Selesai" },
  { value: "ganti_unit", label: "Ganti Unit" },
];

export function LaporanStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", nextStatus);
      await updateLaporanStatusAction(null, formData);
      router.refresh();
    });
  }

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(event) => handleChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-text outline-none focus:border-accent disabled:opacity-60"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
