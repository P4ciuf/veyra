/**
 * Tests for `database/src/setup.ts`.
 *
 * The module performs all of its work at import time (env guard, adapter and
 * client construction), so every test re-imports it fresh with
 * `vi.resetModules()` after arranging the mocked collaborators. `ENV` is
 * mocked instead of the real `env.ts` so tests control the connection string
 * without touching `process.env` or the filesystem; `@prisma/client` and
 * `@prisma/adapter-pg` are mocked because they are true external boundaries
 * (generated client artifacts and a database driver). Mocking them also keeps
 * the suite independent of the `prisma generate` output.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Mock collaborators shared between the `vi.mock` factories and the tests. */
const mocks = vi.hoisted(() => ({
  /** Replaces the generated `PrismaClient` constructor. */
  PrismaClient: vi.fn(),
  /** Replaces the `PrismaPg` driver-adapter constructor. */
  PrismaPg: vi.fn(),
  /** Mutable ENV snapshot; tests assign the connection string before importing. */
  env: { databaseUrl: undefined as string | undefined },
}));

vi.mock("@prisma/client", () => ({ PrismaClient: mocks.PrismaClient }));

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mocks.PrismaPg }));

vi.mock("../../database/src/env.js", () => ({ ENV: mocks.env }));

/** Imports the module under test through the Vite resolver (`.js` → `.ts`). */
const importSetup = (): Promise<typeof import("../../database/src/setup.js")> =>
  import("../../database/src/setup.js");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.env.databaseUrl = undefined;
});

afterEach(() => {
  vi.resetModules();
});

describe("setup", () => {
  it("rejects the import when no connection string is configured", async () => {
    await expect(importSetup()).rejects.toThrow("DATABASE_URL not found in environment variables");

    // The failure path must not build any infrastructure.
    expect(mocks.PrismaPg).not.toHaveBeenCalled();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });

  it("treats an empty connection string as missing", async () => {
    // An empty DATABASE_CONNECTION_STRING (e.g. `DATABASE_CONNECTION_STRING=`
    // in a .env file) is falsy and must trip the same guard as an absent one.
    mocks.env.databaseUrl = "";

    await expect(importSetup()).rejects.toThrow("DATABASE_URL not found in environment variables");

    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });

  it("builds the driver adapter from the configured connection string", async () => {
    mocks.env.databaseUrl = "postgres://user:password@localhost:5432/veyra";

    await importSetup();

    expect(mocks.PrismaPg).toHaveBeenCalledTimes(1);
    expect(mocks.PrismaPg).toHaveBeenCalledWith({
      connectionString: "postgres://user:password@localhost:5432/veyra",
    });
  });

  it("exports a PrismaClient built with the driver adapter", async () => {
    mocks.env.databaseUrl = "postgres://user:password@localhost:5432/veyra";

    const { prisma } = await importSetup();

    // Both collaborators are invoked as constructors, so the produced objects
    // are tracked in `mock.instances`: identity checks prove the exact wiring
    // (the exported singleton is the client created from that one adapter).
    expect(mocks.PrismaPg).toHaveBeenCalledTimes(1);
    expect(mocks.PrismaPg).toHaveBeenCalledWith({
      connectionString: "postgres://user:password@localhost:5432/veyra",
    });
    expect(mocks.PrismaClient).toHaveBeenCalledTimes(1);
    expect(mocks.PrismaClient).toHaveBeenCalledWith({ adapter: mocks.PrismaPg.mock.instances[0] });
    expect(prisma).toBe(mocks.PrismaClient.mock.instances[0]);
  });
});
