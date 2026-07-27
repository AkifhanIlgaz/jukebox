"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { usersApi } from "@/features/admin/api/usersApi";

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: { id: string; username: string }) => usersApi.deleteAdmin(user.id),
    onSuccess: (_data, user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Admin silindi", { description: user.username });
    },
    onError: (error) => {
      toast.danger("Admin silinemedi", { description: getErrorMessage(error) });
    },
  });
}
