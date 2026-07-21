"use client";

import { Drawer } from "@heroui/react";
import { SidebarProvider, useSidebar } from "./context";

type AppLayoutProps = {
  sidebar: React.ReactNode;
  navbar: React.ReactNode;
  children: React.ReactNode;
};

function MobileSidebar({ sidebar }: { sidebar: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Content placement="left" className="w-72">
        <Drawer.Dialog className="h-full">
          <Drawer.CloseTrigger />
          {sidebar}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function DesktopSidebar({ sidebar }: { sidebar: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="hidden shrink-0 p-3 lg:flex">
      <div
        className={`overflow-hidden rounded-2xl border border-border shadow-sm transition-[width] duration-200 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebar}
      </div>
    </div>
  );
}

function AppLayoutInner({ sidebar, navbar, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <DesktopSidebar sidebar={sidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
          {navbar}
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <MobileSidebar sidebar={sidebar} />
    </div>
  );
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutInner {...props} />
    </SidebarProvider>
  );
}
