"use client";

import { Button, Table, Tooltip } from "@heroui/react";
import { ListPlus, Trash2 } from "lucide-react";
import Image from "next/image";

import { useQueue } from "@/features/admin/context/QueueContext";
import { useVideoInfo } from "@/features/admin/hooks/useVideoInfo";

export function PlaylistTableRow({
  youtubeId,
  onRemove,
}: {
  youtubeId: string;
  onRemove: () => void;
}) {
  const { title, channel } = useVideoInfo(youtubeId);
  const { addToQueue } = useQueue();

  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-tertiary">
            <Image
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={title ?? ""}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {title ?? (
                <span className="inline-block h-3.5 w-40 animate-pulse rounded bg-surface-tertiary" />
              )}
            </div>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className="text-sm text-muted">
        {channel ?? <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-surface-tertiary" />}
      </Table.Cell>
      <Table.Cell className="font-mono text-xs text-muted">{youtubeId}</Table.Cell>
      <Table.Cell className="text-end">
        <div className="flex items-center justify-end gap-1">
          <Tooltip delay={0}>
            <Tooltip.Trigger aria-label="Sıraya ekle">
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                onPress={() => addToQueue(youtubeId)}
              >
                <ListPlus className="size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <div className="flex items-center gap-1.5 px-0.5 py-px">
                <ListPlus className="size-3.5" />
                <p className="text-xs font-medium">Sıraya ekle</p>
              </div>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={0}>
            <Tooltip.Trigger aria-label="Şarkıyı kaldır">
              <Button isIconOnly size="sm" variant="danger-soft" onPress={onRemove}>
                <Trash2 className="size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top">
              <Tooltip.Arrow />
              <div className="flex items-center gap-1.5 px-0.5 py-px">
                <Trash2 className="size-3.5" />
                <p className="text-xs font-medium">Sil</p>
              </div>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
