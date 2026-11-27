import type { NextConfig } from "next";

/**
 * Next.js configuration for the site.
 * Runs with the Turbopack bundler and enables the Next 16 partial-prerender
 * features (`cacheComponents`, `partialPrefetching`).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tailwind CSS is wired as a Turbopack rule instead of a PostCSS plugin,
  // which is the supported integration when Turbopack is enabled. The rule must
  // skip CSS Modules: treating a `.module.css` file as plain CSS would drop
  // Next's class-name mapping and leave `styles.*` undefined in components.
  turbopack: {
    rules: {
      "*.css": {
        condition: { not: { path: "*.module.css" } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
