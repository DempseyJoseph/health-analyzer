import type { NextConfig } from "next";

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
  
  // Headers are not supported in static export
  // They will be handled by GitHub Pages configuration if needed
};

export default nextConfig;

