"use client";

import { Tooltip } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useSidebar } from "./context";

export function SidebarThemeToggle() {
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
      <span className="flex size-7 shrink-0 items-center justify-center text-muted transition-colors group-hover:text-foreground">
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
      {!isCollapsed && (isDark ? "Açık Tema" : "Koyu Tema")}
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
