"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { deactivateStaffAction } from "@/app/(app)/akun/actions";

export function StaffActionsMenu({ id, canDeactivate }: { id: string; canDeactivate: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const height = menuRef.current?.offsetHeight ?? 100;
      setPosition({ top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - height - 8)), left: Math.max(8, Math.min(rect.right - 208, window.innerWidth - 216)) });
    }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    updatePosition();
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  function handleDeactivate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await deactivateStaffAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  if (!canDeactivate) {
    return <DotsThreeOutline size={18} className="text-faint" />;
  }

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Tindakan akun staf"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-text"
      >
        <DotsThreeOutline size={18} />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ ...position, width: 208 }} className="cyasset-popover fixed z-50 max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-lg border border-border bg-surface-2 p-1 shadow-xl">
          <form action={handleDeactivate}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
            >
              {isPending ? "Menonaktifkan…" : "Nonaktifkan akun"}
            </button>
          </form>
          {error && <p className="px-3 pb-1.5 text-xs text-danger">{error}</p>}
        </div>, document.body
      )}
    </div>
  );
}
