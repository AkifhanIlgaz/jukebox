"use client";

import { AppLayout } from "@/components/ui/app-layout/AppLayout";
import { Sidebar } from "@/components/ui/app-layout/Sidebar";
import { SidebarCollapseTrigger } from "@/components/ui/app-layout/SidebarCollapseTrigger";
import { SidebarNavItem } from "@/components/ui/app-layout/SidebarNavItem";
import { SidebarTrigger } from "@/components/ui/app-layout/SidebarTrigger";
import { SidebarUserMenu } from "@/components/ui/app-layout/SidebarUserMenu";
import { SidebarThemeToggle } from "@/components/ui/app-layout/SidebarThemeToggle";
import { QueueProvider } from "@/features/admin/context/QueueContext";
import { NowPlayingIndicator } from "@/features/admin/components/NowPlayingIndicator";
import { LayoutDashboard, ListMusic, QrCode, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueueProvider>
      <AppLayout
        sidebar={
          <Sidebar
            header={
              <div className="flex min-w-0 items-center gap-2.5 px-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className="h-6 w-auto shrink-0" />
                <span className="truncate text-sm font-semibold">TINI</span>
              </div>
            }
            collapsedHeader={
              <div className="flex w-full items-center justify-center overflow-hidden">
                <div className="size-8 shrink-0 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.svg" alt="TINI" className="h-full w-full scale-150 object-cover" />
                </div>
              </div>
            }
            footer={
              <SidebarUserMenu name="Akifhan Ilgaz" email="akifhanilgazz@gmail.com" initials="AH" />
            }
          >
            <SidebarNavItem href="/admin" label="Genel Bakış" icon={LayoutDashboard} />
            <SidebarNavItem href="/admin/playlist" label="Playlist" icon={ListMusic} />
            <SidebarNavItem href="/admin/qr" label="QR Kod" icon={QrCode} />
            <SidebarNavItem href="/admin/settings" label="Ayarlar" icon={Settings} />
            <SidebarThemeToggle />
          </Sidebar>
        }
        navbar={
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <SidebarCollapseTrigger />
              <SidebarTrigger />
            </div>
            <div className="flex min-w-0 justify-center">
              <NowPlayingIndicator />
            </div>
            <div />
          </div>
        }
      >
        {children}
      </AppLayout>
    </QueueProvider>
  );
}
