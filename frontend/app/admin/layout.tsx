"use client";

import { AppLayout } from "@/components/ui/app-layout/AppLayout";
import { Sidebar } from "@/components/ui/app-layout/Sidebar";
import { SidebarCollapseTrigger } from "@/components/ui/app-layout/SidebarCollapseTrigger";
import { SidebarNavItem } from "@/components/ui/app-layout/SidebarNavItem";
import { SidebarTrigger } from "@/components/ui/app-layout/SidebarTrigger";
import { SidebarUserFooter } from "@/components/ui/app-layout/SidebarUserFooter";
import { QueueProvider } from "@/features/admin/context/QueueContext";
import { NowPlayingIndicator } from "@/features/admin/components/NowPlayingIndicator";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { LayoutDashboard, ListMusic, QrCode, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROLE_LABELS = {
  boss: "Big Boss",
  admin: "Admin",
} as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { logout } = useLogout();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <QueueProvider>
      <AppLayout
        sidebar={
          <Sidebar
            header={
              <div className="flex min-w-0 items-center gap-2.5 px-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className="h-6 w-auto shrink-0" />
                <span className="truncate text-sm font-semibold">tını</span>
              </div>
            }
            collapsedHeader={
              <div className="flex flex-col w-full items-center justify-center">
                <div className="size-8 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.svg" alt="TINI" className="h-full w-full object-contain" />
                </div>
                <span className="truncate text-xs font-semibold">tını</span>
              </div>
            }
            footer={
              <SidebarUserFooter
                name={currentUser?.username ?? ""}
                email={currentUser ? ROLE_LABELS[currentUser.role] : ""}
                initials={currentUser?.username.slice(0, 2).toUpperCase() ?? ""}
                onLogout={logout}
              />
            }
          >
            <SidebarNavItem href="/admin" label="Genel Bakış" icon={LayoutDashboard} />
            <SidebarNavItem href="/admin/playlist" label="Playlist" icon={ListMusic} />
            <SidebarNavItem href="/admin/qr" label="QR Kod" icon={QrCode} />
            {currentUser?.role === "boss" ? (
              <SidebarNavItem href="/admin/settings" label="Ayarlar" icon={Settings} />
            ) : null}
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
