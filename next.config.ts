import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  experimental: {
    // Next 15+ defaults dynamic-segment client cache to 0s, so every revisit
    // to an already-loaded page (Canvas ↔ Studio, Brief ↔ Build, etc.)
    // re-fetches from the server instead of reusing what's already rendered.
    // This app's data (workspace state, GitHub sync) doesn't need per-second
    // freshness, so give the router cache a real window.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
