"use client";

import { Button } from "@heroui/react";
import { Play } from "lucide-react";
import Image from "next/image";

import { useVideoInfo } from "@/features/admin/hooks/useVideoInfo";

export function QueueItem({
  index,
  youtubeId,
  onPlay,
}: {
  index: number;
  youtubeId: string;
  onPlay: () => void;
}) {
  const { title, channel } = useVideoInfo(youtubeId);

  return (
    <div className="flex items-center gap-2.75">
      <span className="w-3.5 text-xs text-muted tabular-nums">{index + 1}</span>
      <div className="relative size-7.5 shrink-0 overflow-hidden rounded-md bg-surface-tertiary">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title ?? ""}
          fill
          className="object-cover"
          sizes="30px"
        />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">
          {title ?? <span className="inline-block h-3.5 w-32 animate-pulse rounded bg-surface-tertiary" />}
        </div>
        <div className="truncate text-xs text-muted">
          {channel ?? <span className="mt-0.5 inline-block h-3 w-20 animate-pulse rounded bg-surface-tertiary" />}
        </div>
      </div>
      <div className="flex-1" />
      <Button isIconOnly aria-label="Bu şarkıyı çal" variant="secondary" onPress={onPlay}>
        <Play className="size-3.5" />
      </Button>
    </div>
  );
}
