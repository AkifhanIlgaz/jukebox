"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { roundApi } from "@/features/round/api/roundApi";

export function useCloseRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => roundApi.closeRound(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["round", "active"] });
      toast.success("Oylama turu kapatıldı");
    },
    onError: (error) => {
      toast.danger("Oylama turu kapatılamadı", { description: getErrorMessage(error) });
    },
  });
}
