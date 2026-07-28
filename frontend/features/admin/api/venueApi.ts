import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const venueSettingsSchema = z.object({
  roundIntervalMin: z.number(),
  candidateCount: z.number(),
  recentlyPlayedCooldownMin: z.number(),
  candidateCooldownMin: z.number(),
});

export type VenueSettings = z.infer<typeof venueSettingsSchema>;

const venueSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  settings: venueSettingsSchema,
  nowPlaying: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Venue = z.infer<typeof venueSchema>;

export type UpdateVenueInput = {
  name: string;
  logoUrl: string;
  settings: VenueSettings;
};

class VenueApi extends BaseApi {
  async getVenue() {
    return this.get("/venue", venueSchema);
  }

  async updateVenue(input: UpdateVenueInput) {
    return this.put("/venue", venueSchema, input);
  }

  async reportNowPlaying(youtubeId: string) {
    return this.post("/venue/now-playing", z.unknown(), { youtubeId });
  }
}

export const venueApi = new VenueApi();
