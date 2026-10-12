"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ userName, children }: { userName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  useEffect(() => { dialogRef.current?.close(); }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px) and (hover: hover) and (pointer: fine)");
    const closeOnDesktop = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="cyasset-app flex h-dvh min-w-0 flex-col overflow-hidden xl:flex-row">
      <div className="desktop-navigation hidden shrink-0 xl:flex">
        <Sidebar userName={userName} />
      </div>
      <header className="print-hide flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2.5 xl:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-border text-text hover:bg-surface-2"
        >
          <List size={22} />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-base font-semibold text-text">
          <Image src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-lg" />
          CyAsset
        </Link>
        <div className="ml-auto"><ThemeToggle compact /></div>
      </header>
      <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        {children}
      </main>
      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="Menu navigasi CyAsset"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}
        className="navigation-drawer print-hide m-0 h-dvh max-h-none w-[min(320px,calc(100%-2rem))] max-w-none overflow-hidden border-r border-border bg-surface p-0 text-text backdrop:bg-black/60"
      >
        <Sidebar userName={userName} drawer onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
      </dialog>
    </div>
  );
}
