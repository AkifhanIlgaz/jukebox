"use client";

import { Button, Card, Input } from "@heroui/react";
import { ListMusic } from "lucide-react";
import { useState } from "react";

import { NowPlayingCard } from "@/features/admin/components/NowPlayingCard";
import { QueueItem } from "@/features/admin/components/QueueItem";
import { useQueue } from "@/features/admin/context/QueueContext";
import { extractYouTubeId } from "@/features/admin/lib/youtube";

export default function AdminQrPage() {
  const { nowPlayingId, queue, addToQueue, playFromQueue, handleEnded } = useQueue();
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  function handleAddToQueue(event: React.FormEvent) {
    event.preventDefault();
    if (!inputValue.trim()) return;

    const videoId = extractYouTubeId(inputValue);
    if (!videoId) {
      setInputError("Geçersiz YouTube linki");
      return;
    }
    setInputError(null);
    setInputValue("");
    addToQueue(videoId);
  }

  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">QR Kod</h1>

      <NowPlayingCard youtubeId={nowPlayingId} onEnded={handleEnded} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="px-5.5 py-5">
          <div className="mb-3.5 text-base font-semibold">Sıraya ekle</div>
          <form className="flex flex-col gap-1.5" onSubmit={handleAddToQueue}>
            <div className="flex gap-2">
              <Input
                aria-invalid={inputError !== null}
                aria-label="YouTube video linki"
                className="flex-1"
                placeholder="YouTube linki (ör. https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  setInputError(null);
                }}
              />
              <Button type="submit" variant="primary">
                Ekle
              </Button>
            </div>
            {inputError && <div className="text-xs text-danger">{inputError}</div>}
          </form>
        </Card>

        <Card className="px-5.5 py-5">
          <div className="mb-3.5 text-base font-semibold">Sıradaki şarkılar</div>
          {queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ListMusic className="size-8 text-muted" />
              <div className="text-sm font-medium">Kuyruk boş</div>
              <div className="text-xs text-muted">
                Yukarıdan bir YouTube linki ekleyerek başlayabilirsin.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {queue.map((entry, index) => (
                <QueueItem
                  key={entry.key}
                  index={index}
                  youtubeId={entry.videoId}
                  onPlay={() => playFromQueue(entry.key)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
