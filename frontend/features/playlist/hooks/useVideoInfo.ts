import { useQuery } from "@tanstack/react-query";

import { youtubeApi } from "@/lib/youtube-api";

export function useVideoInfo(videoId: string) {
  const { data } = useQuery({
    queryKey: ["youtube-video", videoId],
    queryFn: () => youtubeApi.fetchVideoInfo(videoId),
    staleTime: Infinity,
  });

  return { title: data?.title ?? null, channel: data?.channel ?? null };
}
