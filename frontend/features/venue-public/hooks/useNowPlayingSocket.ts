"use client";

import { useState } from "react";

import { getWsUrl } from "@/api/client";
import { useEnvelopeSocket } from "@/lib/ws-socket";

// useNowPlayingSocket, /ws/venue/:slug'a bağlanıp NOW_PLAYING broadcast'ini
// dinler; sunucudan realtime bir güncelleme gelene kadar ilk REST yükünü
// (GetPublicVenue) gösterir.
export function useNowPlayingSocket(slug: string, initialNowPlaying: string) {
  const [override, setOverride] = useState<string | null>(null);

  useEnvelopeSocket(getWsUrl(`/ws/venue/${slug}`), (envelope) => {
    if (envelope.type === "NOW_PLAYING") {
      setOverride((envelope.payload as { youtubeVideoId: string }).youtubeVideoId);
    }
  });

  return override ?? initialNowPlaying;
}
