"use client";

import { AlertDialog, Button, Card, Spinner } from "@heroui/react";
import { ListMusic, Trash2 } from "lucide-react";

import { useQueue } from "@/features/admin/context/QueueContext";
import { QueueItem } from "@/features/queue/components/QueueItem";
import { useClearQueue } from "@/features/queue/hooks/useClearQueue";
import { useQueueList } from "@/features/queue/hooks/useQueueList";
import { useRemoveFromQueue } from "@/features/queue/hooks/useRemoveFromQueue";

export function QueueList() {
  const { data, isLoading } = useQueueList();
  const removeFromQueueMutation = useRemoveFromQueue();
  const clearQueueMutation = useClearQueue();
  const { playNow } = useQueue();
  const tracks = data?.tracks ?? [];
  const total = data?.total ?? 0;

  return (
    <Card className="px-5.5 py-5">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <div className="text-base font-semibold">Sıradaki şarkılar ({total})</div>
        <AlertDialog>
          <Button variant="danger-soft" size="sm" isDisabled={total === 0 || clearQueueMutation.isPending}>
            <Trash2 className="size-4" />
            Sırayı Sıfırla
          </Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-[400px]">
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>Sırayı sıfırla?</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p>Çalma sırasındaki tüm şarkılar kaldırılacak. Bu işlem geri alınamaz.</p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary">
                    Vazgeç
                  </Button>
                  <Button slot="close" variant="danger" onPress={() => clearQueueMutation.mutate()}>
                    Sıfırla
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </div>
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
