import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "services.sentinel-hub.com",
      },
    ],
  },
};

export default nextConfig;
