"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { NowPlayingCard } from "@/features/admin/components/NowPlayingCard";
import { AddToQueueForm } from "@/features/queue/components/AddToQueueForm";
import { QueueList } from "@/features/queue/components/QueueList";
import { ActiveRoundCard } from "@/features/round/components/ActiveRoundCard";

export default function AdminQrPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <PageHeader
        title="QR Kod"
        description="Aktif oylama turunu ve çalma kuyruğunu buradan takip et, kuyruğa manuel şarkı ekle."
      />

      <NowPlayingCard />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ActiveRoundCard />
        <div className="flex flex-col gap-4">
          <AddToQueueForm />
          <QueueList />
        </div>
      </div>
    </div>
  );
}
