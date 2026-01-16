import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export for Cloudflare Pages deployment
  output: "export",
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence warning
  turbopack: {},
};

export default withPWA(nextConfig);
