"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggleIconButton() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Açık temaya geç" : "Koyu temaya geç";

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      className="group relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-tertiary text-muted transition-colors hover:text-accent"
    >
      <Sun
        className={`absolute size-4.5 transition-all duration-300 ease-out ${
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 group-hover:rotate-45"
        }`}
      />
      <Moon
        className={`absolute size-4.5 transition-all duration-300 ease-out ${
          isDark ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12" : "rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
