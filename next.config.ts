import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fabric.js (et autres libs canvas) ne sont pas compatibles avec le double-mount de StrictMode
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  turbopack: {},
};

export default nextConfig;
