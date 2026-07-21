"use client";

import { Button, Card, Slider } from "@heroui/react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

import { useYouTubePlayer } from "@/features/admin/hooks/useYouTubePlayer";

function formatDuration(totalSeconds: number) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function NowPlayingCard({ youtubeId }: { youtubeId: string }) {
  const {
    mountRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    title,
    channel,
    handleSeek,
    handleSeekEnd,
    togglePlayback,
    toggleMute,
  } = useYouTubePlayer(youtubeId);

  return (
    <Card className="flex flex-row flex-wrap items-end justify-center gap-4.5 px-5.5 py-4.5">
      <div ref={mountRef} className="hidden" />
      <div className="relative size-18 shrink-0 overflow-hidden rounded-xl bg-surface-tertiary">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title ?? ""}
          fill
          className="object-cover"
          sizes="90px"
        />
      </div>

      <div className="min-w-40 flex-1">
        <Card.Header className="gap-0">
          <Card.Title className="text-accent">Şu an çalıyor</Card.Title>
        </Card.Header>
        <Card.Content className="gap-0.5">
          <div className="text-lg font-semibold">
            {title ?? <span className="inline-block h-5 w-40 animate-pulse rounded bg-surface-tertiary" />}
          </div>
          <Card.Description>
            {channel ?? <span className="mt-1 inline-block h-3.5 w-28 animate-pulse rounded bg-surface-tertiary" />}
          </Card.Description>
        </Card.Content>
      </div>

      <div className="min-w-42 flex-[1.1]">
        <Slider
          aria-label="Şarkı ilerlemesi"
          value={currentTime}
          minValue={0}
          maxValue={duration || 1}
          onChange={(value) => handleSeek(value as number)}
          onChangeEnd={(value) => handleSeekEnd(value as number)}
          className="group/seek"
        >
          <Slider.Track className="h-1 border-x-[0.375rem] transition-[height] group-hover/seek:h-1.5">
            <Slider.Fill />
            <Slider.Thumb
              className="opacity-0 transition-opacity after:size-3 after:rounded-full after:shadow-md after:ring-2 after:ring-background group-hover/seek:opacity-100 data-[dragging=true]:opacity-100 data-[focus-visible=true]:opacity-100"
              style={{ width: "0.75rem" }}
            />
          </Slider.Track>
        </Slider>
        <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          isIconOnly
          variant="secondary"
          aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
          onPress={toggleMute}
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Button
          isIconOnly
          variant="primary"
          aria-label={isPlaying ? "Durdur" : "Oynat"}
          onPress={togglePlayback}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>
    </Card>
  );
}
