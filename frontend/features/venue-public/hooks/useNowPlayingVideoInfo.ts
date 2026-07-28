"use client";

import { useQuery } from "@tanstack/react-query";

import { youtubeApi } from "@/lib/youtube-api";

export function useNowPlayingVideoInfo(youtubeId: string) {
  return useQuery({
    queryKey: ["now-playing-video-info", youtubeId],
    queryFn: () => youtubeApi.fetchVideoInfo(youtubeId),
    enabled: youtubeId.length > 0,
  });
}
