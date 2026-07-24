"use client";

import { AppLayout } from "@/components/ui/app-layout/AppLayout";
import { Sidebar } from "@/components/ui/app-layout/Sidebar";
import { SidebarCollapseTrigger } from "@/components/ui/app-layout/SidebarCollapseTrigger";
import { SidebarNavItem } from "@/components/ui/app-layout/SidebarNavItem";
import { SidebarTrigger } from "@/components/ui/app-layout/SidebarTrigger";
import { SidebarUserMenu } from "@/components/ui/app-layout/SidebarUserMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { QueueProvider } from "@/features/admin/context/QueueContext";
import { Button } from "@heroui/react";
import { Bell, LayoutDashboard, ListMusic, Music, QrCode, Search, Settings } from "lucide-react";

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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Music className="size-4.5" />
                </div>
                <span className="truncate text-sm font-semibold">Jukebox</span>
              </div>
            }
            collapsedHeader={
              <div className="flex w-full items-center justify-center">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Music className="size-4.5" />
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
          </Sidebar>
        }
        navbar={
          <div className="flex w-full items-center justify-between gap-4 mt-2 ">
            <div className="flex items-center gap-3">
              <SidebarCollapseTrigger />
              <SidebarTrigger />
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard className="size-4 text-muted" />
                Genel Bakış
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button isIconOnly variant="ghost" size="sm" aria-label="Ara">
                <Search className="size-4.5" />
              </Button>
              <Button isIconOnly variant="ghost" size="sm" aria-label="Bildirimler">
                <Bell className="size-4.5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        }
      >
        {children}
      </AppLayout>
    </QueueProvider>
  );
}
