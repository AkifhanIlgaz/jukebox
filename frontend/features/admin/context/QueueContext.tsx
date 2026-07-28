"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { venueApi } from "@/features/admin/api/venueApi";
import { useYouTubePlayer } from "@/features/admin/hooks/useYouTubePlayer";
import { useNextTrack } from "@/features/queue/hooks/useNextTrack";

type QueueContextValue = {
  nowPlayingId: string | null;
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
  playNow: (youtubeId: string) => void;
};

const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const nextTrackMutation = useNextTrack();

  const advance = useCallback(() => {
    nextTrackMutation.mutate(undefined, {
      onSuccess: (nextTrack) => setNowPlayingId(nextTrack.youtubeId),
      onError: () => setNowPlayingId(null),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnded = useCallback(() => {
    if (nowPlayingId) void venueApi.reportPlayerState({ youtubeId: nowPlayingId, state: "ended" });
    advance();
  }, [nowPlayingId, advance]);

  const handleError = useCallback(() => {
    if (nowPlayingId) void venueApi.reportPlayerState({ youtubeId: nowPlayingId, state: "error" });
    advance();
  }, [nowPlayingId, advance]);

  const handlePlaying = useCallback(() => {
    if (nowPlayingId) void venueApi.reportPlayerState({ youtubeId: nowPlayingId, state: "playing" });
  }, [nowPlayingId]);

  const player = useYouTubePlayer(nowPlayingId, {
    onEnded: handleEnded,
    onError: handleError,
    onPlaying: handlePlaying,
  });

  const playNow = useCallback((youtubeId: string) => {
    setNowPlayingId(youtubeId);
  }, []);

  return (
    <QueueContext.Provider
      value={{
        nowPlayingId,
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
        playNow,
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
