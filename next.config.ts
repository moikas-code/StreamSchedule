import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_JWT_SECRET: process.env.JWT_SECRET,
  },
};

export default nextConfig;
