"use client";

import { useQuery } from "@tanstack/react-query";

import { usersApi } from "@/features/admin/api/usersApi";

export function useVenueUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.listUsers(),
  });
}
