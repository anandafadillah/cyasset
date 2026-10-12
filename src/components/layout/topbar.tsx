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
    <div className="page-topbar sticky top-0 z-10 flex min-h-[66px] flex-none flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6 xl:h-[66px] xl:flex-nowrap xl:gap-4 xl:py-0">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        {breadcrumb && <div className="mt-0.5 text-xs text-dim">{breadcrumb}</div>}
      </div>
      <div className="topbar-actions flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto xl:gap-3">
        {actions}
        <TopbarSearch className="hidden w-56 xl:flex 2xl:w-70" />
        <div className="desktop-theme hidden xl:block"><ThemeToggle /></div>
      </div>
    </div>
  );
}
