import { z } from "zod";

import { extractYouTubeId } from "@/lib/youtube";

export const addSongSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube linki zorunlu")
    .refine((url) => extractYouTubeId(url) !== null, "Geçerli bir YouTube linki girin"),

});

export type AddSongFormValues = z.infer<typeof addSongSchema>;
