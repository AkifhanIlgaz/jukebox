"use client";

import { Button } from "@heroui/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "./context";

export function SidebarCollapseTrigger() {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={isCollapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"}
      className="hidden lg:flex"
      onPress={toggleCollapsed}
    >
      {isCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
    </Button>
  );
}
