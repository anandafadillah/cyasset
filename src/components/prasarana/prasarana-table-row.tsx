"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function PrasaranaTableRow({ id, children }: { id: string; children: ReactNode }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/prasarana/${id}/edit`)}
      className="cursor-pointer border-b border-border last:border-0 hover:bg-white/5"
    >
      {children}
    </tr>
  );
}
