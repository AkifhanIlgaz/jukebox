"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import type { AddTrackPayload } from "@/features/playlist/api/trackApi";
import { trackApi } from "@/features/playlist/api/trackApi";

export function useAddTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationKey, PlaylistTable'ın useMutationState ile bu mutation'ın
    // pending durumunu izleyip playlist importu sırasında tablonun üstünde
    // yükleme göstergesi çizebilmesi için var.
    mutationKey: ["addTrack"],
    mutationFn: (payload: AddTrackPayload) => trackApi.addTrack(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });

      if (data.added !== undefined) {
        const skippedNote = data.skipped ? `, ${data.skipped} zaten playlist'teydi` : "";
        toast.success("Playlist eklendi", { description: `${data.added} şarkı eklendi${skippedNote}` });
        return;
      }

      toast.success("Şarkı eklendi", { description: "Playlist'e eklendi" });
    },
    onError: (error) => {
      toast.danger("Şarkı eklenemedi", { description: getErrorMessage(error) });
    },
  });
}
