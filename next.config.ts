import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage の画像を表示するため
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // LP のプレースホルダー画像（Unsplash）
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Server Actions のボディサイズ上限を緩める（画像アップロード用）
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
