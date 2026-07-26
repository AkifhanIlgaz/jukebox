"use client";

import { Card } from "@heroui/react";
import { ListMusic } from "lucide-react";

import { QueueItem } from "@/features/queue/components/QueueItem";
import { useQueueList } from "@/features/queue/hooks/useQueueList";

export function QueueList() {
  const { data, isLoading } = useQueueList();
  const tracks = data?.tracks ?? [];

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 text-base font-semibold">Sıradaki şarkılar</div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-7.5 animate-pulse rounded bg-surface-tertiary" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ListMusic className="size-8 text-muted" />
          <div className="text-sm font-medium">Kuyruk boş</div>
          <div className="text-xs text-muted">Yukarıdan bir YouTube linki ekleyerek başlayabilirsin.</div>
        </div>
      ) : (
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
      )}
    </Card>
  );
}
