"use client";

import { NowPlayingCard } from "@/features/admin/components/NowPlayingCard";
import { AddToQueueForm } from "@/features/queue/components/AddToQueueForm";
import { QueueList } from "@/features/queue/components/QueueList";
import { ActiveRoundCard } from "@/features/round/components/ActiveRoundCard";

export default function AdminQrPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">QR Kod</h1>

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
