import { z } from "zod";

export const venueSettingsFormSchema = z.object({
  name: z.string().min(1, "Mekan adı zorunlu"),
  logoUrl: z.string(),
  roundIntervalMin: z.number().int().min(1, "En az 1 dakika olmalı"),
  candidateCount: z.number().int().min(1, "En az 1 aday olmalı"),
  recentlyPlayedCooldownMin: z.number().int().min(1, "En az 1 dakika olmalı"),
  candidateCooldownMin: z.number().int().min(1, "En az 1 dakika olmalı"),
});

export type VenueSettingsFormValues = z.infer<typeof venueSettingsFormSchema>;
