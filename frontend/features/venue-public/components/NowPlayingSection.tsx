"use client";

import { Skeleton } from "@heroui/react";
import { Disc3 } from "lucide-react";
import Image from "next/image";

import { useNowPlayingVideoInfo } from "@/features/venue-public/hooks/useNowPlayingVideoInfo";

export function NowPlayingSection({ youtubeId }: { youtubeId: string }) {
  const videoInfo = useNowPlayingVideoInfo(youtubeId);

  if (!youtubeId) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative mx-auto flex aspect-square w-1/2 items-center justify-center overflow-hidden rounded-2xl bg-surface-tertiary shadow-md">
          <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-transparent" />
          <Disc3 className="size-12 animate-pulse text-muted/50" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold text-muted">Çalan şarkı yok</div>
          <div className="text-sm text-muted/70">Bir şarkı çalmaya başlayınca burada görünecek</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative mx-auto aspect-square w-1/2 overflow-hidden rounded-2xl bg-surface-tertiary shadow-md">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
          alt={videoInfo.data?.title ?? ""}
          fill
          className="object-cover"
          sizes="224px"
        />
      </div>
      <div className="w-full min-w-0 text-center">
        <div className="text-xs font-semibold text-accent">Şu an çalıyor</div>
        {videoInfo.isPending ? (
          <div className="mt-1.5 flex flex-col items-center gap-1.5">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        ) : (
          <>
            <div className="line-clamp-2 text-lg font-semibold break-words">{videoInfo.data?.title ?? "—"}</div>
            <div className="truncate text-sm text-muted">{videoInfo.data?.channel ?? ""}</div>
          </>
        )}
      </div>
    </div>
  );
}
