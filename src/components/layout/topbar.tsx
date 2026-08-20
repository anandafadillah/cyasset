import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopbarSearch } from "@/components/layout/topbar-search";

export function Topbar({
  title,
  breadcrumb,
  actions,
}: {
  title: string;
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-[66px] flex-none items-center gap-4 border-b border-border bg-surface px-6">
      <div>
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        {breadcrumb && <div className="mt-0.5 text-xs text-dim">{breadcrumb}</div>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {actions}
        <TopbarSearch />
        <ThemeToggle />
      </div>
    </div>
  );
}
