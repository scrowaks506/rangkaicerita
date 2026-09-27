import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build ringan: hanya bundle server + file yang dipakai (bukan full runtime).
  // Hasilnya di .next/standalone — jalan dengan `node server.js`, RAM ~100-200MB.
  output: "standalone",
};

export default nextConfig;
