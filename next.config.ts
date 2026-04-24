import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Partial Prerendering (PPR) + 'use cache' directive
  cacheComponents: true,
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

