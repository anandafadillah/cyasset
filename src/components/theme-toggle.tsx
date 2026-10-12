"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "dark" | "light";

function subscribeTheme(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== "cyasset-theme") return;
    document.documentElement.setAttribute("data-theme", event.newValue === "light" ? "light" : "dark");
    onChange();
  }
  window.addEventListener("cyasset-theme-change", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("cyasset-theme-change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function serverTheme(): Theme { return "dark"; }

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);

  function applyTheme(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("cyasset-theme", next); } catch { /* The theme still works when storage is unavailable. */ }
    window.dispatchEvent(new Event("cyasset-theme-change"));
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        aria-label="Gunakan tema gelap"
        onClick={() => applyTheme("dark")}
        aria-current={theme === "dark"}
        className={`flex min-h-11 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors xl:min-h-0 ${
          theme === "dark" ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
        }`}
      >
        <Moon size={15} weight="fill" />
        <span className={compact ? "hidden sm:inline" : undefined}>Gelap</span>
      </button>
      <button
        type="button"
        aria-label="Gunakan tema terang"
        onClick={() => applyTheme("light")}
        aria-current={theme === "light"}
        className={`flex min-h-11 items-center justify-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-semibold transition-colors xl:min-h-0 ${
          theme === "light" ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
        }`}
      >
        <Sun size={15} />
        <span className={compact ? "hidden sm:inline" : undefined}>Terang</span>
      </button>
    </div>
  );
}
