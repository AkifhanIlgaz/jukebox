"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { trackApi } from "@/features/playlist/api/trackApi";
import type { AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";

export function useAddTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AddSongFormValues) => trackApi.addTrack(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      toast.success("Şarkı eklendi", { description: "Playlist'e eklendi" });
    },
    onError: (error) => {
      toast.danger("Şarkı eklenemedi", { description: getErrorMessage(error) });
    },
  });
}
