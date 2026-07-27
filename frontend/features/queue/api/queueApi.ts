import { z } from "zod";

import { BaseApi } from "@/api/base-api";
import type { AddSongFormValues } from "@/features/playlist/schemas/add-song-schema";

const queuedTrackSchema = z.object({
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  channel: z.string(),
  createdAt: z.coerce.date(),
  addedBy: z.string(),
});

export type QueuedTrack = z.infer<typeof queuedTrackSchema>;

const queueResponseSchema = z.object({
  tracks: z.array(queuedTrackSchema),
  total: z.number(),
});

const addToQueueResponseSchema = z.object({
  message: z.string(),
});

class QueueApi extends BaseApi {
  async getQueue() {
    return this.get("/queue", queueResponseSchema);
  }

  async addToQueue(values: AddSongFormValues) {
    return this.post("/queue", addToQueueResponseSchema, values);
  }

  async next() {
    return this.post("/queue/next", queuedTrackSchema);
  }

  async removeFromQueue(youtubeId: string) {
    return this.delete(`/queue/${youtubeId}`, z.unknown());
  }

  async clearQueue() {
    return this.delete("/queue", z.unknown());
  }
}

export const queueApi = new QueueApi();
