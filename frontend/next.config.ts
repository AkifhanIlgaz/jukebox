import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://img.youtube.com/vi/**")],
  },
};

export default nextConfig;
