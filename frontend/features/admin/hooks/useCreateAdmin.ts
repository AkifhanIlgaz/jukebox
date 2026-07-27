"use client";

import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/api/client";
import { usersApi, type CreateAdminInput } from "@/features/admin/api/usersApi";

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdminInput) => usersApi.createAdmin(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Admin eklendi");
    },
    onError: (error) => {
      toast.danger("Admin eklenemedi", { description: getErrorMessage(error) });
    },
  });
}
