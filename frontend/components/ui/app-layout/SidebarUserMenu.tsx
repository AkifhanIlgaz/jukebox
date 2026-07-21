"use client";

import { Avatar, Dropdown, Label } from "@heroui/react";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import { useSidebar } from "./context";

type SidebarUserMenuProps = {
  name: string;
  email: string;
  initials: string;
};

export function SidebarUserMenu({ name, email, initials }: SidebarUserMenuProps) {
  const { isCollapsed } = useSidebar();

  return (
    <Dropdown>
      <Dropdown.Trigger className="w-full rounded-xl">
        <div
          className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-tertiary ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Avatar size="sm" color="accent">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{name}</div>
                <div className="truncate text-xs text-muted">{email}</div>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-muted" />
            </>
          )}
        </div>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top" className="w-64">
        <Dropdown.Menu>
          <Dropdown.Item id="profile" textValue="Profil">
            <User className="size-4 shrink-0 text-muted" />
            <Label>Profil</Label>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Ayarlar">
            <Settings className="size-4 shrink-0 text-muted" />
            <Label>Ayarlar</Label>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue="Çıkış Yap" variant="danger">
            <LogOut className="size-4 shrink-0 text-danger" />
            <Label>Çıkış Yap</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
