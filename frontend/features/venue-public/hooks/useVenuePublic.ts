"use client";

import { useQuery } from "@tanstack/react-query";

import { venuePublicApi } from "@/features/venue-public/api/venuePublicApi";

export function useVenuePublic(slug: string) {
  return useQuery({
    queryKey: ["venue-public", slug],
    queryFn: () => venuePublicApi.getVenue(slug),
  });
}
