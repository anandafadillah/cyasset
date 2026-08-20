"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("cyasset-theme") as Theme | null) ?? "dark";
    setTheme(saved);
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cyasset-theme", next);
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => applyTheme("dark")}
        aria-current={theme === "dark"}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
          theme === "dark" ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
        }`}
      >
        <Moon size={15} weight="fill" />
        Gelap
      </button>
      <button
        type="button"
        onClick={() => applyTheme("light")}
        aria-current={theme === "light"}
        className={`flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-semibold transition-colors ${
          theme === "light" ? "bg-accent-soft text-accent" : "text-muted hover:text-text"
        }`}
      >
        <Sun size={15} />
        Terang
      </button>
    </div>
  );
}
