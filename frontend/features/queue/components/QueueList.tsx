"use client";

import { Card, Spinner } from "@heroui/react";
import { ListMusic } from "lucide-react";

import { useQueue } from "@/features/admin/context/QueueContext";
import { QueueItem } from "@/features/queue/components/QueueItem";
import { useQueueList } from "@/features/queue/hooks/useQueueList";
import { useRemoveFromQueue } from "@/features/queue/hooks/useRemoveFromQueue";

export function QueueList() {
  const { data, isLoading } = useQueueList();
  const removeFromQueueMutation = useRemoveFromQueue();
  const { playNow } = useQueue();
  const tracks = data?.tracks ?? [];
  const total = data?.total ?? 0;

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 text-base font-semibold">Sıradaki şarkılar ({total})</div>
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Spinner size="md" />
          <div className="text-sm font-medium">Sıra yükleniyor...</div>
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
              isRemoving={
                removeFromQueueMutation.isPending &&
                removeFromQueueMutation.variables?.youtubeId === track.youtubeId
              }
              title={track.title}
              youtubeId={track.youtubeId}
              channel={track.channel}
              onPlayNow={() => {
                playNow(track.youtubeId);
                removeFromQueueMutation.mutate({ youtubeId: track.youtubeId, title: track.title });
              }}
              onRemove={() =>
                removeFromQueueMutation.mutate({ youtubeId: track.youtubeId, title: track.title })
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
