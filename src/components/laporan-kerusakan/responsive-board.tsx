"use client";

import { useId, useState, type ReactNode } from "react";

export function ResponsiveBoard({ columns }: {
  columns: { status: string; label: string; count: number; content: ReactNode }[];
}) {
  const id = useId();
  const [active, setActive] = useState(columns[0].status);

  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="Status laporan kerusakan" className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        {columns.map((column, index) => (
          <button
            key={column.status}
            id={`${id}-${column.status}-tab`}
            role="tab"
            type="button"
            aria-selected={active === column.status}
            aria-controls={`${id}-${column.status}-panel`}
            tabIndex={active === column.status ? 0 : -1}
            onClick={() => setActive(column.status)}
            onKeyDown={(event) => {
              const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              const target = event.key === "Home" ? 0 : event.key === "End" ? columns.length - 1
                : offset ? (index + offset + columns.length) % columns.length : undefined;
              if (target === undefined) return;
              event.preventDefault();
              setActive(columns[target].status);
              document.getElementById(`${id}-${columns[target].status}-tab`)?.focus();
            }}
            className={`flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium ${active === column.status ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted"}`}
          >
            <span>{column.label}</span><span className="shrink-0 tabular-nums">{column.count}</span>
          </button>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-3.5 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.status} id={`${id}-${column.status}-panel`} role="tabpanel" aria-labelledby={`${id}-${column.status}-tab`} className={active === column.status ? "min-w-0" : "hidden min-w-0 lg:block"}>
            {column.content}
          </div>
        ))}
      </div>
    </div>
  );
}
