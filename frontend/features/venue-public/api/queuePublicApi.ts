import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const publicQueuedTrackSchema = z.object({
  id: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  channel: z.string(),
  createdAt: z.coerce.date(),
  addedBy: z.string(),
});

export type PublicQueuedTrack = z.infer<typeof publicQueuedTrackSchema>;

const publicQueueResponseSchema = z.object({
  tracks: z.array(publicQueuedTrackSchema),
  total: z.number(),
});

class QueuePublicApi extends BaseApi {
  async getQueue(slug: string) {
    return this.get(`/v/${slug}/queue`, publicQueueResponseSchema);
  }
}

export const queuePublicApi = new QueuePublicApi();
