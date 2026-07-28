"use client";

import { useQuery } from "@tanstack/react-query";

import { queuePublicApi } from "@/features/venue-public/api/queuePublicApi";

export function useQueuePublic(slug: string) {
  return useQuery({
    queryKey: ["queue-public", slug],
    queryFn: () => queuePublicApi.getQueue(slug),
  });
}
