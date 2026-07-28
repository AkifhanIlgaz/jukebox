import axios from "axios";
import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const publicCandidateSchema = z.object({
  trackId: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  channel: z.string(),
  votes: z.number(),
});

export type PublicCandidate = z.infer<typeof publicCandidateSchema>;

const publicRoundSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  status: z.enum(["open", "closed"]),
  startedAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  candidates: z.array(publicCandidateSchema),
  winnerYoutubeId: z.string().nullish(),
});

export type PublicRound = z.infer<typeof publicRoundSchema>;

class RoundPublicApi extends BaseApi {
  async getActiveRound(slug: string): Promise<PublicRound | null> {
    try {
      return await this.get(`/v/${slug}/round`, publicRoundSchema);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

export const roundPublicApi = new RoundPublicApi();
