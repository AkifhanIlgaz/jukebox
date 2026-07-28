import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const publicVenueSchema = z.object({
  name: z.string(),
  logoUrl: z.string(),
  nowPlaying: z.string(),
});

export type PublicVenue = z.infer<typeof publicVenueSchema>;

class VenuePublicApi extends BaseApi {
  async getVenue(slug: string) {
    return this.get(`/v/${slug}`, publicVenueSchema);
  }
}

export const venuePublicApi = new VenuePublicApi();
