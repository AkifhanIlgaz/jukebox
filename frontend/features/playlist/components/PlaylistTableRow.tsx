"use client";

import { Button, Spinner, Table, Tooltip } from "@heroui/react";
import { ListPlus, Trash2 } from "lucide-react";
import Image from "next/image";

export function PlaylistTableRow({
  youtubeId,
  title,
  channel,
  onAddToQueue,
  onDelete,
  isDeleting,
}: {
  youtubeId: string;
  title: string;
  channel: string;
  onAddToQueue: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-tertiary">
            <Image
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt={title}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{title}</div>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className="text-sm font-semibold">{channel}</Table.Cell>
      <Table.Cell className="text-end">
        <div className="flex items-center justify-end gap-1">
          <Tooltip delay={0}>
            <Tooltip.Trigger aria-label="Sıraya ekle">
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                onPress={onAddToQueue}
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
              <Button
                isIconOnly
                isPending={isDeleting}
                size="sm"
                variant="danger-soft"
                onPress={onDelete}
              >
                {({ isPending }) =>
                  isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <Trash2 className="size-4" />
                  )
                }
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
