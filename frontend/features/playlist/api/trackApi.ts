import { z } from "zod";

import { BaseApi } from "@/api/base-api";
import type { AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";

const venueTrackSchema = z.object({
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  channel: z.string(),
  createdAt: z.coerce.date(),
  addedBy: z.string(),
});

export type VenueTrack = z.infer<typeof venueTrackSchema>;

const paginatedTracksSchema = z.object({
  tracks: z.array(venueTrackSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginatedTracks = z.infer<typeof paginatedTracksSchema>;

const addTrackResponseSchema = z.object({
  message: z.string(),
});

class TrackApi extends BaseApi {
  async addTrack(values: AddSongFormValues) {
    return this.post("/tracks", addTrackResponseSchema, values);
  }

  async getVenueTracks(params: { page: number; limit: number }) {
    return this.get("/tracks", paginatedTracksSchema, { params });
  }

  async deleteTrack(trackId: string) {
    return this.delete(`/tracks/${trackId}`, z.unknown());
  }
}

export const trackApi = new TrackApi();
