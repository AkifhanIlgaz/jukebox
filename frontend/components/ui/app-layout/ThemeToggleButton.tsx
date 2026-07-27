"use client";

import { Tooltip } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useSidebar } from "./context";

export function ThemeToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Açık temaya geç" : "Koyu temaya geç";

  const button = (
    <button
      type="button"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      className={`group flex w-full items-center gap-2.5 rounded-xl py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-tertiary hover:text-foreground ${
        isCollapsed ? "justify-center px-1.5" : "pr-2.5 pl-1.5"
      }`}
    >
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden text-muted transition-colors group-hover:text-accent">
        <Sun
          className={`absolute size-4 transition-all duration-300 ease-out ${
            isDark
              ? "-rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 group-hover:rotate-45"
          }`}
        />
        <Moon
          className={`absolute size-4 transition-all duration-300 ease-out ${
            isDark
              ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12"
              : "rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
      {!isCollapsed && "Temayı değiştir"}
    </button>
  );

  if (!isCollapsed) {
    return button;
  }

  return (
    <Tooltip delay={200}>
      {button}
      <Tooltip.Content showArrow placement="right">
        <Tooltip.Arrow />
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}
