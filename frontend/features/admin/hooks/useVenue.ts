"use client";

import { useQuery } from "@tanstack/react-query";

import { venueApi } from "@/features/admin/api/venueApi";

export function useVenue() {
  return useQuery({
    queryKey: ["venue"],
    queryFn: () => venueApi.getVenue(),
  });
}
