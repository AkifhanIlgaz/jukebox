"use client";

import { useQuery } from "@tanstack/react-query";

import { trackApi } from "@/features/playlist/api/trackApi";

export function useTracks(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ["tracks", params.page, params.limit],
    queryFn: () => trackApi.getVenueTracks(params),
    placeholderData: (previous) => previous,
  });
}
