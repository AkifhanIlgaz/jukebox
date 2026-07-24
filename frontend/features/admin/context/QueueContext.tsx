"use client";

import { createContext, useCallback, useContext, useState } from "react";

type QueueEntry = { key: string; videoId: string };

type QueueContextValue = {
  nowPlayingId: string | null;
  queue: QueueEntry[];
  addToQueue: (videoId: string) => void;
  playFromQueue: (key: string) => void;
  handleEnded: () => void;
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

  return (
    <QueueContext.Provider value={{ nowPlayingId, queue, addToQueue, playFromQueue, handleEnded }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used within a QueueProvider");
  return context;
}
