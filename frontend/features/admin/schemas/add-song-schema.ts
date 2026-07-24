import { z } from "zod";

import { extractYouTubeId } from "@/features/admin/lib/youtube";

export const addSongSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, "YouTube linki zorunlu")
    .refine((value) => extractYouTubeId(value) !== null, {
      message: "Geçerli bir YouTube linki gir",
    }),
});

export type AddSongFormValues = z.infer<typeof addSongSchema>;
