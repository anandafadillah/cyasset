"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BarangTableRow({ id, children }: { id: string; children: ReactNode }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/barang/${id}`)}
      className="cursor-pointer border-b border-border last:border-0 hover:bg-white/5"
    >
      {children}
    </tr>
  );
}
