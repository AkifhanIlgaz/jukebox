"use client";

import { useQuery } from "@tanstack/react-query";

import { queueApi } from "@/features/queue/api/queueApi";

export function useQueueList() {
  return useQuery({
    queryKey: ["queue"],
    queryFn: () => queueApi.getQueue(),
  });
}
