"use client";

import { Skeleton } from "@heroui/react";
import { ListMusic } from "lucide-react";

import { QueueItem } from "@/features/queue/components/QueueItem";
import type { PublicQueuedTrack } from "@/features/venue-public/api/queuePublicApi";

// QueueSection, müşteri /v/{slug} sayfasındaki sıra sekmesi. QueueItem'ı
// admin ile aynı satır görünümüyle ama salt-okunur kullanır (onPlayNow/
// onRemove verilmediği için butonlar gizli).
export function QueueSection({
  tracks,
  isPending,
}: {
  tracks: PublicQueuedTrack[] | undefined;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-surface-tertiary">
          <ListMusic className="size-6 animate-pulse text-muted/50" strokeWidth={1.5} />
        </div>
        <div className="text-sm font-semibold text-muted">Kuyrukta şarkı yok</div>
        <div className="text-sm text-muted/70">Oylama kazananı burada sırada görünecek</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tracks.map((track, index) => (
        <QueueItem
          key={track.id}
          index={index}
          youtubeId={track.youtubeId}
          title={track.title}
          channel={track.channel}
        />
      ))}
    </div>
  );
}
