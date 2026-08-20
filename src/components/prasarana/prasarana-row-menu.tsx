"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, DotsThreeOutline, PencilSimple, QrCode } from "@phosphor-icons/react";
import { archivePrasaranaAction } from "@/app/(app)/prasarana/actions";

const MENU_WIDTH = 176;

export function PrasaranaRowMenu({ id, nama }: { id: string; nama: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    }

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  function handleArchive() {
    if (!confirm(`Arsipkan "${nama}"? Data ini tidak akan muncul lagi di Daftar Prasarana.`)) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      await archivePrasaranaAction(null, formData);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-text"
      >
        <DotsThreeOutline size={18} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-50 rounded-lg border border-border bg-surface-2 p-1 shadow-xl"
          >
            <Link
              href={`/prasarana/${id}/edit`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text hover:bg-white/5"
            >
              <PencilSimple size={15} /> Edit
            </Link>
            <Link
              href={`/prasarana/${id}/cetak-qr`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text hover:bg-white/5"
            >
              <QrCode size={15} /> Cetak QR
            </Link>
            <button
              type="button"
              onClick={handleArchive}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
            >
              <Archive size={15} /> {isPending ? "Mengarsipkan…" : "Arsipkan"}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
