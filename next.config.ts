import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "view", value: "notes" }],
        destination: "/notes",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
