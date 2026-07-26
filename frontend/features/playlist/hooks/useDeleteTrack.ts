"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { trackApi } from "@/features/playlist/api/trackApi";

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (track: { id: string; title: string }) => trackApi.deleteTrack(track.id),
    onSuccess: (_data, track) => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      toast.success("Şarkı silindi", { description: track.title });
    },
    onError: (error) => {
      toast.danger("Şarkı silinemedi", { description: getErrorMessage(error) });
    },
  });
}
