import type { NextConfig } from "next";

// Static export for GitHub Pages. The site is served from
// https://<user>.github.io/grantagent-demo/, so every route and asset
// needs that prefix; set BASE_PATH="" for a local `npx serve out`.
const basePath = process.env.BASE_PATH ?? "/grantagent-demo";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
