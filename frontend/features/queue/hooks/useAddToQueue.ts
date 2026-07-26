"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import type { AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";
import { queueApi } from "@/features/queue/api/queueApi";

export function useAddToQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AddSongFormValues) => queueApi.addToQueue(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Şarkı sıraya eklendi");
    },
    onError: (error) => {
      toast.danger("Şarkı sıraya eklenemedi", { description: getErrorMessage(error) });
    },
  });
}
