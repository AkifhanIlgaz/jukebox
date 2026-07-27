"use client";

import { useQuery } from "@tanstack/react-query";

import { roundApi } from "@/features/round/api/roundApi";

export function useActiveRound() {
  return useQuery({
    queryKey: ["round", "active"],
    queryFn: () => roundApi.getActiveRound(),
  });
}
