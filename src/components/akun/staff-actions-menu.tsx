"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { deactivateStaffAction } from "@/app/(app)/akun/actions";

export function StaffActionsMenu({ id, canDeactivate }: { id: string; canDeactivate: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid size-7 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-text"
      >
        <DotsThreeOutline size={18} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-border bg-surface-2 p-1 shadow-xl">
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
        </div>
      )}
    </div>
  );
}
