"use client";

import { Button, Slider } from "@heroui/react";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

import { useQueue } from "@/features/admin/context/QueueContext";
import { formatDuration } from "@/lib/format";

export function NowPlayingIndicator() {
  const {
    nowPlayingId,
    title,
    channel,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    handleSeek,
    handleSeekEnd,
    togglePlayback,
    toggleMute,
  } = useQueue();

  if (!nowPlayingId) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 text-xs text-muted">
        <Music2 className="size-3.5" />
        Çalan şarkı yok
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 max-w-120 items-center gap-2 rounded-full border border-accent/30 bg-accent/5 py-1 pl-1.5 pr-2 shadow-sm sm:gap-3 sm:pr-3">
      <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-surface-tertiary ring-2 ring-accent/40">
        <Image
          src={`https://img.youtube.com/vi/${nowPlayingId}/mqdefault.jpg`}
          alt={title ?? ""}
          fill
          className="object-cover"
          sizes="28px"
        />
        {isPlaying && (
          <span className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-accent ring-2 ring-background" />
        )}
      </div>

      <div className="min-w-0 flex-1 text-left sm:flex-none sm:shrink-0 sm:basis-32">
        <div className="truncate text-xs font-semibold text-foreground">
          {title ?? <span className="inline-block h-3 w-24 animate-pulse rounded bg-surface-tertiary" />}
        </div>
        {channel && (
          <div className=" truncate text-[0.6875rem] font-medium text-accent sm:block">{channel}</div>
        )}
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
        <span className="shrink-0 text-[0.6875rem] text-muted tabular-nums">
          {formatDuration(currentTime)}
        </span>
        <Slider
          aria-label="Şarkı ilerlemesi"
          value={currentTime}
          minValue={0}
          maxValue={duration || 1}
          onChange={(value) => handleSeek(value as number)}
          onChangeEnd={(value) => handleSeekEnd(value as number)}
          className="group/seek min-w-0 flex-1"
        >
          <Slider.Track className="h-1 border-x-[0.375rem] transition-[height] group-hover/seek:h-1.5">
            <Slider.Fill />
            <Slider.Thumb
              className="opacity-0 transition-opacity after:size-3 after:rounded-full after:shadow-md after:ring-2 after:ring-background group-hover/seek:opacity-100 data-[dragging=true]:opacity-100 data-[focus-visible=true]:opacity-100"
              style={{ width: "0.75rem" }}
            />
          </Slider.Track>
        </Slider>
        <span className="shrink-0 text-[0.6875rem] text-muted tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
          className=" size-6 sm:flex"
          onPress={toggleMute}
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Button
          isIconOnly
          size="sm"
          aria-label={isPlaying ? "Durdur" : "Oynat"}
          className="size-6"
          onPress={togglePlayback}
        >
          {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
        </Button>
      </div>
    </div>
  );
}
