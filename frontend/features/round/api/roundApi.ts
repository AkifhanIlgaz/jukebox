import axios from "axios";
import { z } from "zod";

import { BaseApi } from "@/api/base-api";

const candidateSchema = z.object({
  trackId: z.string(),
  youtubeId: z.string(),
  title: z.string(),
  channel: z.string(),
  votes: z.number(),
});

export type Candidate = z.infer<typeof candidateSchema>;

const roundSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  status: z.enum(["open", "closed"]),
  startedAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  candidates: z.array(candidateSchema),
  winnerYoutubeId: z.string().nullish(),
});

export type Round = z.infer<typeof roundSchema>;

class RoundApi extends BaseApi {
  async getActiveRound(): Promise<Round | null> {
    try {
      return await this.get("/round", roundSchema);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async startRound() {
    return this.post("/round/start", roundSchema);
  }
}

export const roundApi = new RoundApi();
