"use client";

import { Printer } from "@phosphor-icons/react";

export function PrintQrButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      <Printer size={16} weight="bold" />
      Cetak
    </button>
  );
}
