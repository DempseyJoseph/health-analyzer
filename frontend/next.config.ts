import type { NextConfig } from "next";
type RouteHeader = { key: string; value: string };

// Get basePath from environment variable, default to empty string
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: "export",
  
  // Set basePath for GitHub Pages deployment
  basePath: basePath,
  
  // Set assetPrefix to match basePath
  assetPrefix: basePath,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Runtime flags
  reactStrictMode: true,
  trailingSlash: true,

  // Response headers for COOP/COEP and wasm content-type
  async headers() {
    const commonSecurityHeaders: RouteHeader[] = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ];

    return [
      {
        source: "/:path*",
        headers: commonSecurityHeaders,
      },
      {
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;

