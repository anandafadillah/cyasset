"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { navGroups } from "./nav-items";
import { signOutAction } from "@/app/(app)/actions";

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials =
    userName
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <aside className="flex w-59 flex-none flex-col overflow-y-auto border-r border-border bg-surface px-3.5 py-4.5">
      <div className="flex items-center gap-2.5 px-2 pb-4.5 text-lg font-semibold text-text">
        <Image src="/logo.png" alt="CyAsset" width={32} height={32} className="size-8 flex-none rounded-[9px]" />
        CyAsset
      </div>

      <nav className="flex flex-col gap-0.5">
        {navGroups.map((group, groupIndex) => (
          <div key={group.section ?? `group-${groupIndex}`}>
            {group.section && (
              <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-2.75 py-2.25 text-sm transition-colors ${
                    active ? "bg-accent-soft text-accent" : "text-muted hover:bg-white/5 hover:text-text"
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 bottom-1.5 -left-3.5 w-[3px] rounded-r-full bg-accent" />
                  )}
                  <item.icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-2 pt-3">
        <span className="grid size-8.5 flex-none place-items-center rounded-[9px] bg-surface-3 text-[13px] font-semibold text-text">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-text">{userName}</div>
          <div className="text-[11px] text-dim">Admin Sarpras</div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Keluar"
            className="grid size-8 flex-none place-items-center rounded-lg text-dim hover:bg-white/5 hover:text-text"
          >
            <SignOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
