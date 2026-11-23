/**
 * Tests for `database/src/env.ts`.
 *
 * `ENV` is built once at module load, so every test re-imports the module with
 * `vi.resetModules()` after arranging the process environment. The import
 * specifier must be a literal string: variable specifiers bypass the Vite
 * resolver and cannot map the `.js` extension onto the `.ts` source.
 *
 * `env.ts` calls `dotenv.config()` at import time, which reads a real `.env`
 * file from the process cwd. Mocking dotenv removes that filesystem
 * dependency so these assertions only see the process environment arranged by
 * each test (the same isolation strategy as the bot's `config/env` suite).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// Spy kept outside the factory (hoisted) so tests can assert the call.
const dotenvMocks = vi.hoisted(() => ({
  config: vi.fn<() => { parsed?: unknown }>(),
}));

vi.mock("dotenv", () => ({ default: { config: dotenvMocks.config } }));

/** Imports the module under test through the Vite resolver (`.js` → `.ts`). */
const importEnv = (): Promise<typeof import("../../database/src/env.js")> =>
  import("../../database/src/env.js");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  dotenvMocks.config.mockClear();
});

describe("ENV", () => {
  it("maps DATABASE_CONNECTION_STRING from the process environment", async () => {
    vi.stubEnv("DATABASE_CONNECTION_STRING", "postgres://user:password@localhost:5432/veyra");

    const { ENV } = await importEnv();

    expect(ENV.databaseUrl).toBe("postgres://user:password@localhost:5432/veyra");
  });

  it("leaves databaseUrl undefined when it is not configured", async () => {
    // Save and restore: deleting a real process property must not leak to
    // other tests if the key is present in the surrounding environment.
    const savedUrl = process.env.DATABASE_CONNECTION_STRING;
    Reflect.deleteProperty(process.env, "DATABASE_CONNECTION_STRING");

    try {
      const { ENV } = await importEnv();

      expect(ENV.databaseUrl).toBeUndefined();
    } finally {
      if (savedUrl !== undefined) process.env.DATABASE_CONNECTION_STRING = savedUrl;
    }
  });

  it("loads .env files through dotenv at import time", async () => {
    vi.stubEnv("DATABASE_CONNECTION_STRING", "postgres://user:password@localhost:5432/veyra");

    await importEnv();

    expect(dotenvMocks.config).toHaveBeenCalledTimes(1);
  });
});
