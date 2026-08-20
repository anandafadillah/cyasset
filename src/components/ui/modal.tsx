"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-text"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
