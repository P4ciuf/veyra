/**
 * Tests for `database/prisma.config.ts`, the configuration consumed by the
 * Prisma 7 CLI.
 *
 * The module runs its work at import time (`dotenv.config()` and
 * `defineConfig()`), so every test re-imports it with `vi.resetModules()` after
 * arranging the environment. `@prisma/config` is mocked to capture the object
 * the CLI would receive, and `dotenv` is mocked so the suite never reads a real
 * `.env` file from the process cwd. The datasource URL is read from
 * `DATABASE_CONNECTION_STRING`, matching `src/env.ts` and the compose stack.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

/** Mock collaborators shared between the `vi.mock` factories and the tests. */
const mocks = vi.hoisted(() => ({
  /** Identity implementation: records the object the CLI would receive. */
  defineConfig: vi.fn((config: unknown) => config),
  /** Records the options passed to dotenv. */
  dotenvConfig: vi.fn(),
}));

vi.mock("@prisma/config", () => ({ defineConfig: mocks.defineConfig }));

vi.mock("dotenv", () => ({ default: { config: mocks.dotenvConfig } }));

/** Imports the module under test through the Vite resolver (`.js` → `.ts`). */
const importConfig = (): Promise<unknown> => import("../../database/prisma.config.js");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("prisma.config", () => {
  it("loads database/.env through dotenv at import time", async () => {
    await importConfig();

    expect(mocks.dotenvConfig).toHaveBeenCalledTimes(1);
    expect(mocks.dotenvConfig).toHaveBeenCalledWith({ path: ".env" });
  });

  it("points the Prisma CLI at the schema and migrations directory", async () => {
    await importConfig();

    expect(mocks.defineConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: "prisma",
        migrations: { path: "prisma/migrations" },
      }),
    );
  });

  it("reads the datasource URL from DATABASE_CONNECTION_STRING", async () => {
    vi.stubEnv("DATABASE_CONNECTION_STRING", "postgresql://user:password@localhost:5432/veyra");

    await importConfig();

    expect(mocks.defineConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        datasource: { url: "postgresql://user:password@localhost:5432/veyra" },
      }),
    );
  });

  it("leaves the datasource URL undefined when it is not configured", async () => {
    // Save and restore: deleting a real process property must not leak to
    // other tests if the key is present in the surrounding environment.
    const savedUrl = process.env.DATABASE_CONNECTION_STRING;
    Reflect.deleteProperty(process.env, "DATABASE_CONNECTION_STRING");

    try {
      await importConfig();

      expect(mocks.defineConfig).toHaveBeenCalledWith(
        expect.objectContaining({ datasource: { url: undefined } }),
      );
    } finally {
      if (savedUrl !== undefined) process.env.DATABASE_CONNECTION_STRING = savedUrl;
    }
  });
});
