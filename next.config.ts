import type { NextConfig } from "next";

const extraOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
      ...(extraOrigins.length ? { allowedOrigins: extraOrigins } : {}),
    },
  },
};

export default nextConfig;
