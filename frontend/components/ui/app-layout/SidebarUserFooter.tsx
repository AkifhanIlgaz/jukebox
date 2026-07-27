"use client";

import { Avatar, Button, Tooltip } from "@heroui/react";
import { LogOut } from "lucide-react";

import { ThemeToggleButton } from "./ThemeToggleButton";
import { useSidebar } from "./context";

type SidebarUserFooterProps = {
  name: string;
  email: string;
  initials: string;
  onLogout?: () => void;
};

function LogoutButton({ onLogout }: { onLogout?: () => void }) {
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label="Çıkış Yap">
        <Button isIconOnly size="sm" variant="danger-soft" onPress={onLogout}>
          <LogOut className="size-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow placement="top">
        <Tooltip.Arrow />
        <p className="text-xs font-medium">Çıkış Yap</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

export function SidebarUserFooter({ name, email, initials, onLogout }: SidebarUserFooterProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <ThemeToggleButton />
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <LogoutButton onLogout={onLogout} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <ThemeToggleButton />

      <div className="flex w-full items-center gap-2.5 rounded-xl p-1.5">
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted">{email}</div>
        </div>
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
}
