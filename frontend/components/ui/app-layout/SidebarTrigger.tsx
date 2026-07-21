"use client";

import { Button } from "@heroui/react";
import { Menu } from "lucide-react";
import { useSidebar } from "./context";

export function SidebarTrigger() {
  const { setIsOpen } = useSidebar();

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label="Menüyü aç"
      className="lg:hidden"
      onPress={() => setIsOpen(true)}
    >
      <Menu className="size-4.5" />
    </Button>
  );
}
