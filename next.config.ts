import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Enable after implementing caching patterns (Phases 1-4)
  // Enable Partial Prerendering (PPR) + 'use cache' directive
  // cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;

