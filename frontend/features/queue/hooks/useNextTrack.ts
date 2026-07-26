"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queueApi } from "@/features/queue/api/queueApi";

export function useNextTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => queueApi.next(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}
