"use client";

import { Button, Spinner } from "@heroui/react";
import { Play, Trash2 } from "lucide-react";
import Image from "next/image";

export function QueueItem({
  index,
  youtubeId,
  title,
  channel,
  onPlayNow,
  onRemove,
  isRemoving,
}: {
  index: number;
  youtubeId: string;
  title: string;
  channel: string;
  onPlayNow?: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.75">
      <span className="w-3.5 text-xs text-muted tabular-nums">{index + 1}</span>
      <div className="relative size-7.5 shrink-0 overflow-hidden rounded-md bg-surface-tertiary">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title}
          fill
          className="object-cover"
          sizes="30px"
        />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted">{channel}</div>
      </div>
      <div className="flex-1" />
      {onPlayNow ? (
        <Button isIconOnly aria-label="Hemen çal" size="sm" variant="secondary" onPress={onPlayNow}>
          <Play className="size-3.5" />
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          isIconOnly
          aria-label="Sıradan çıkar"
          isPending={isRemoving}
          size="sm"
          variant="danger-soft"
          onPress={onRemove}
        >
          {({ isPending }) => (isPending ? <Spinner color="current" size="sm" /> : <Trash2 className="size-3.5" />)}
        </Button>
      ) : null}
    </div>
  );
}
