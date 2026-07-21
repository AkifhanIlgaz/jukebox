"use client";

import { useSidebar } from "./context";

type SidebarProps = {
  header?: React.ReactNode;
  collapsedHeader?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function Sidebar({ header, collapsedHeader, footer, children }: SidebarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      {header && (
        <div className="flex items-center justify-between gap-2 px-3.5 pt-3.5 pb-2">
          {isCollapsed ? collapsedHeader : header}
        </div>
      )}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-3">
        {children}
      </nav>
      {footer && <div className="border-t border-border px-2.5 py-2.5">{footer}</div>}
    </div>
  );
}
