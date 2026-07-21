"use client";

import { NavLink } from "@/components/ui/NavLink";
import { Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./context";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function SidebarNavItem({ href, label, icon: Icon }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { setIsOpen, isCollapsed } = useSidebar();
  const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);

  const link = (
    <NavLink
      href={href}
      onPress={() => setIsOpen(false)}
      className={`group flex w-full items-center gap-2.5 rounded-xl py-1.5 text-sm font-medium no-underline transition-colors ${
        isCollapsed ? "justify-center px-1.5" : "pr-2.5 pl-1.5"
      } ${isActive ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-tertiary hover:text-foreground"}`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center transition-colors ${
          isActive ? "text-accent" : "text-muted group-hover:text-foreground"
        }`}
      >
        <Icon className="size-4" />
      </span>
      {!isCollapsed && label}
    </NavLink>
  );

  if (!isCollapsed) {
    return link;
  }

  return (
    <Tooltip delay={200}>
      {link}
      <Tooltip.Content showArrow placement="right">
        <Tooltip.Arrow />
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}
