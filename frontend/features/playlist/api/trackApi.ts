import { z } from "zod";

import { BaseApi } from "@/api/base-api";

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
  added: z.number().optional(),
  skipped: z.number().optional(),
});

export type AddTrackResponse = z.infer<typeof addTrackResponseSchema>;

export type AddTrackPayload = {
  youtubeUrl: string;
  // mode, link hem video hem playlist içerdiğinde ("v=...&list=...")
  // hangisinin ekleneceğini belirtir; link tek anlamlıysa gerekmez.
  mode?: "video" | "playlist";
};

class TrackApi extends BaseApi {
  async addTrack(payload: AddTrackPayload) {
    return this.post("/tracks", addTrackResponseSchema, payload);
  }

  async getVenueTracks(params: { page: number; limit: number }) {
    return this.get("/tracks", paginatedTracksSchema, { params });
  }

  async deleteTrack(trackId: string) {
    return this.delete(`/tracks/${trackId}`, z.unknown());
  }
}

export const trackApi = new TrackApi();
