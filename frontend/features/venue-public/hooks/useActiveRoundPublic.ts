"use client";

import { useQuery } from "@tanstack/react-query";

import { roundPublicApi } from "@/features/venue-public/api/roundPublicApi";

export function useActiveRoundPublic(slug: string) {
  return useQuery({
    queryKey: ["round-public", slug],
    queryFn: () => roundPublicApi.getActiveRound(slug),
  });
}
