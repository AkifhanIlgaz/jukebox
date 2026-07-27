"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { queueApi } from "@/features/queue/api/queueApi";

export function useClearQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => queueApi.clearQueue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Sıra sıfırlandı");
    },
    onError: (error) => {
      toast.danger("Sıra sıfırlanamadı", { description: getErrorMessage(error) });
    },
  });
}
