import { youtubeApi } from "@/features/admin/api/youtube-api";

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID_PATTERN = /^[a-zA-Z0-9_-]{13,}$/;

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const vParam = url.searchParams.get("v");
    if (vParam && YOUTUBE_ID_PATTERN.test(vParam)) return vParam;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (YOUTUBE_ID_PATTERN.test(id)) return id;
    }
  } catch {
    return null;
  }

  return null;
}

export function extractYouTubePlaylistId(input: string): string | null {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("list");
    if (listParam && PLAYLIST_ID_PATTERN.test(listParam)) return listParam;
  } catch {
    return null;
  }

  return null;
}

export type YouTubeInput =
  | { type: "video"; videoId: string }
  | { type: "playlist"; playlistId: string }
  | { type: "invalid" };

export function classifyYouTubeInput(input: string): YouTubeInput {
  const videoId = extractYouTubeId(input);
  if (videoId) return { type: "video", videoId };

  const playlistId = extractYouTubePlaylistId(input);
  if (playlistId) return { type: "playlist", playlistId };

  return { type: "invalid" };
}

export async function logYouTubeInput(input: string): Promise<void> {
  const parsed = classifyYouTubeInput(input);

  if (parsed.type === "invalid") {
    console.log("Geçersiz YouTube linki:", input);
    return;
  }

  if (parsed.type === "playlist") {
    console.log("Playlist import henüz desteklenmiyor:", parsed.playlistId);
    return;
  }

  const { title, channel } = await youtubeApi.fetchVideoInfo(parsed.videoId);
  console.log({ id: parsed.videoId, title, channel });
}
