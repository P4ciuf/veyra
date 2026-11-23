/**
 * Tests for `apps/discordBot/src/config/env.ts`.
 * `ENV` is built once at module load, so every test re-imports the module with
 * `vi.resetModules()` after arranging the process environment. The import
 * specifier must be a literal string: variable specifiers bypass the Vite
 * resolver and cannot map the `.js` extension onto the `.ts` source.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// `env.ts` calls `dotenv.config()` at import time, which reads a real `.env`
// file from the process cwd (the repository root when Vitest runs, where the
// Docker compose stack keeps its `.env`). Mocking dotenv removes that
// filesystem dependency so these assertions only see the process environment
// arranged by each test.
vi.mock("dotenv", () => ({ default: { config: () => ({}) } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("ENV", () => {
  it("maps DISCORD_TOKEN, DISCORD_CLIENT_ID and NODE_ENV from the process environment", async () => {
    vi.stubEnv("DISCORD_TOKEN", "token-value");
    vi.stubEnv("DISCORD_CLIENT_ID", "client-id-value");
    vi.stubEnv("NODE_ENV", "development");

    const { ENV } = await import("../../../../apps/discordBot/src/config/env.js");

    expect(ENV.token).toBe("token-value");
    expect(ENV.clientId).toBe("client-id-value");
    expect(ENV.nodeEnv).toBe("development");
  });

  it("falls back to production when NODE_ENV is empty", async () => {
    vi.stubEnv("NODE_ENV", "");

    const { ENV } = await import("../../../../apps/discordBot/src/config/env.js");

    expect(ENV.nodeEnv).toBe("production");
  });

  it("leaves token and clientId undefined when they are not configured", async () => {
    // Save and restore: deleting real process properties must not leak to
    // other tests if the keys are ever present in the surrounding environment.
    const savedToken = process.env.DISCORD_TOKEN;
    const savedClientId = process.env.DISCORD_CLIENT_ID;
    Reflect.deleteProperty(process.env, "DISCORD_TOKEN");
    Reflect.deleteProperty(process.env, "DISCORD_CLIENT_ID");

    try {
      const { ENV } = await import("../../../../apps/discordBot/src/config/env.js");

      expect(ENV.token).toBeUndefined();
      expect(ENV.clientId).toBeUndefined();
    } finally {
      if (savedToken !== undefined) process.env.DISCORD_TOKEN = savedToken;
      if (savedClientId !== undefined) process.env.DISCORD_CLIENT_ID = savedClientId;
    }
  });
});
