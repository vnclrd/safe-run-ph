import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },

  /* IMPORTANT: If your site is at vnclrd.github.io/safe-run-ph/, 
    uncomment the line below and change it to your repo name. 
    If you use a custom domain, you don't need this.
  */
  // basePath: "/safe-run-ph", 
};

export default nextConfig;