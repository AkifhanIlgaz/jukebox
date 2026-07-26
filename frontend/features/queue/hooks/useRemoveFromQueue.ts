"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { queueApi } from "@/features/queue/api/queueApi";

export function useRemoveFromQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (track: { youtubeId: string; title: string }) =>
      queueApi.removeFromQueue(track.youtubeId),
    onSuccess: (_data, track) => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Sıradan çıkarıldı", { description: track.title });
    },
    onError: (error) => {
      toast.danger("Sıradan çıkarılamadı", { description: getErrorMessage(error) });
    },
  });
}
