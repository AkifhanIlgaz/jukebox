"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { venueApi, type UpdateVenueInput } from "@/features/admin/api/venueApi";

export function useUpdateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateVenueInput) => venueApi.updateVenue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue"] });
      toast.success("Ayarlar güncellendi");
    },
    onError: (error) => {
      toast.danger("Ayarlar güncellenemedi", { description: getErrorMessage(error) });
    },
  });
}
