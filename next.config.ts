import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure WASM files get the correct Content-Type
  async headers() {
    return [
      {
        source: "/stockfish/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/stockfish/(.*)\\.wasm",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
