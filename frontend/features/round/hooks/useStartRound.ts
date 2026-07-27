"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { roundApi } from "@/features/round/api/roundApi";

export function useStartRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => roundApi.startRound(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["round", "active"] });
      toast.success("Oylama turu başlatıldı");
    },
    onError: (error) => {
      toast.danger("Oylama turu başlatılamadı", { description: getErrorMessage(error) });
    },
  });
}
