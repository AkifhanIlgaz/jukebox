import axios from "axios";
import { z } from "zod";

const videoInfoSchema = z.object({
  title: z.string(),
  author_name: z.string(),
});

export type VideoInfo = { title: string; channel: string };

class YoutubeApi {
  private readonly client = axios.create({ baseURL: "https://www.youtube.com" });

  async fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    const response = await this.client.get("/oembed", {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: "json",
      },
    });
    const data = videoInfoSchema.parse(response.data);
    return { title: data.title, channel: data.author_name };
  }
}

export const youtubeApi = new YoutubeApi();
