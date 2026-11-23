/**
 * Tests for `apps/site/src/app/api/health/route.ts`.
 *
 * The route is the liveness probe consumed by the compose `site` healthcheck
 * (`wget -qO- http://127.0.0.1:3000/api/health`), so its contract is the
 * standard Fetch `Response` returned to Next.js: a 200 JSON body. The handler
 * has no dependencies, which keeps this suite in the default node environment.
 */
import { describe, expect, it } from "vitest";
import { GET } from "../../../../apps/site/src/app/api/health/route.js";

describe("GET /api/health", () => {
  it("responds with a 200 JSON body carrying the ok flag", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
