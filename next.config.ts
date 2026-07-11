import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / Node DB drivers — keep out of the bundler.
  serverExternalPackages: ["pg", "better-sqlite3"],
};

export default nextConfig;
