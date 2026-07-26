"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { useYouTubePlayer } from "@/features/admin/hooks/useYouTubePlayer";

type QueueEntry = { key: string; videoId: string };

type QueueContextValue = {
  nowPlayingId: string | null;
  queue: QueueEntry[];
  addToQueue: (videoId: string) => void;
  playFromQueue: (key: string) => void;
  mountRef: ReturnType<typeof useYouTubePlayer>["mountRef"];
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  title: string | null;
  channel: string | null;
  handleSeek: (value: number) => void;
  handleSeekEnd: (value: number) => void;
  togglePlayback: () => void;
  toggleMute: () => void;
};

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const addToQueue = useCallback((videoId: string) => {
    setNowPlayingId((current) => {
      if (current === null) return videoId;
      setQueue((currentQueue) => [...currentQueue, { key: crypto.randomUUID(), videoId }]);
      return current;
    });
  }, []);

  const playFromQueue = useCallback((key: string) => {
    setQueue((current) => {
      const entry = current.find((item) => item.key === key);
      if (!entry) return current;
      setNowPlayingId(entry.videoId);
      return current.filter((item) => item.key !== key);
    });
  }, []);

  const handleEnded = useCallback(() => {
    setQueue((current) => {
      if (current.length === 0) return current;
      const [next, ...rest] = current;
      setNowPlayingId(next.videoId);
      return rest;
    });
  }, []);

  const player = useYouTubePlayer(nowPlayingId, { onEnded: handleEnded });

  return (
    <QueueContext.Provider
      value={{
        nowPlayingId,
        queue,
        addToQueue,
        playFromQueue,
        mountRef: player.mountRef,
        isPlaying: player.isPlaying,
        isMuted: player.isMuted,
        currentTime: player.currentTime,
        duration: player.duration,
        title: player.title,
        channel: player.channel,
        handleSeek: player.handleSeek,
        handleSeekEnd: player.handleSeekEnd,
        togglePlayback: player.togglePlayback,
        toggleMute: player.toggleMute,
      }}
    >
      <div ref={player.mountRef} className="hidden" />
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used within a QueueProvider");
  return context;
}
