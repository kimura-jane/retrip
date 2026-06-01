import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      // 本人確認画像（最大10MB）・アバター（最大5MB）を Server Action で
      // 受けるため、デフォルト 1MB の上限を引き上げる。
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
