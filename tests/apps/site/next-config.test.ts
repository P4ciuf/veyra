/**
 * Tests for `apps/site/next.config.ts`.
 *
 * The module is a plain configuration object; the assertions pin the settings
 * that the site build depends on (the Next 16 partial-prerender flags and the
 * Turbopack rule that compiles Tailwind CSS). `next` is imported as a type
 * only, so the module evaluates without a Next.js runtime.
 *
 * `apps/site/package.json` has no `"type": "module"`, so TypeScript resolves
 * the config as CommonJS while Vite exposes its default export; the local
 * shape below avoids depending on Next's type package from the root tests
 * project.
 */
import { describe, expect, it } from "vitest";
import nextConfigModule from "../../../apps/site/next.config.js";

/** Subset of `NextConfig` asserted by this suite. */
interface SiteNextConfig {
  cacheComponents?: boolean;
  partialPrefetching?: boolean;
  turbopack?: {
    rules?: Record<string, unknown>;
  };
}

const nextConfig = nextConfigModule as unknown as SiteNextConfig;

describe("next.config", () => {
  it("enables the Next 16 cache and partial-prefetch features", () => {
    expect(nextConfig.cacheComponents).toBe(true);
    expect(nextConfig.partialPrefetching).toBe(true);
  });

  it("routes CSS files through the Tailwind Turbopack loader", () => {
    const cssRule = nextConfig.turbopack?.rules?.["*.css"];

    expect(cssRule).toEqual({
      condition: { not: { path: "*.module.css" } },
      loaders: ["@tailwindcss/turbopack"],
      as: "*.css",
    });
  });
});
