/**
 * Tests for `database/src/setup.ts`.
 *
 * The client is lazy: importing the module must not read configuration or build
 * infrastructure, while the first property access must validate
 * `DATABASE_CONNECTION_STRING`, create the client once and bind methods to it.
 * Every test re-imports the module with `vi.resetModules()` after arranging its
 * boundaries. `@prisma/client` and `@prisma/adapter-pg` are mocked because they
 * are external artifacts requiring a generated client and a database driver;
 * `src/env.ts` is mocked so tests control the import-time snapshot while the
 * live process environment is stubbed independently.
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

/** Connection string used by the tests that exercise a successful setup. */
const url = "postgres://user:password@localhost:5432/veyra";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(process.env, "DATABASE_CONNECTION_STRING");
  mocks.env.databaseUrl = undefined;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("setup", () => {
  it("does not read configuration or construct a client at import time", async () => {
    const { prisma } = await importSetup();

    expect(prisma).toBeDefined();
    expect(mocks.PrismaPg).not.toHaveBeenCalled();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });

  it("throws on first use when no connection string is configured", async () => {
    const { prisma } = await importSetup();

    // Reading a delegate is the first use that resolves the real client.
    expect(() => prisma.user).toThrow("DATABASE_URL not found in environment variables");
    expect(mocks.PrismaPg).not.toHaveBeenCalled();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });

  it("treats an empty connection string as missing on first use", async () => {
    mocks.env.databaseUrl = "";

    const { prisma } = await importSetup();

    expect(() => prisma.user).toThrow("DATABASE_URL not found in environment variables");
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });

  it("builds the driver adapter and client on first property access", async () => {
    vi.stubEnv("DATABASE_CONNECTION_STRING", url);

    const { prisma } = await importSetup();
    expect(mocks.PrismaPg).not.toHaveBeenCalled();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();

    // Reading a delegate is the first use that resolves the real client.
    expect(prisma.user).toBeUndefined();

    expect(mocks.PrismaPg).toHaveBeenCalledTimes(1);
    expect(mocks.PrismaPg).toHaveBeenCalledWith({ connectionString: url });
    expect(mocks.PrismaClient).toHaveBeenCalledTimes(1);
    expect(mocks.PrismaClient).toHaveBeenCalledWith({ adapter: mocks.PrismaPg.mock.instances[0] });
    expect(prisma).toBeInstanceOf(mocks.PrismaClient);
  });

  it("prefers the live environment over the import-time snapshot", async () => {
    mocks.env.databaseUrl = "postgres://stale:stale@127.0.0.1:5432/build";
    vi.stubEnv("DATABASE_CONNECTION_STRING", url);

    const { prisma } = await importSetup();
    expect(prisma.user).toBeUndefined();

    // The snapshot can be captured at build time; runtime configuration must win.
    expect(mocks.PrismaPg).toHaveBeenCalledWith({ connectionString: url });
  });

  it("reuses a single client and binds its methods to the real instance", async () => {
    vi.stubEnv("DATABASE_CONNECTION_STRING", url);
    const ping = vi.fn();
    const instance = { ping };
    // A `function` implementation keeps the mock usable as a constructor.
    mocks.PrismaClient.mockImplementation(function () {
      return instance;
    });

    const { prisma } = await importSetup();
    const proxiedPing = (prisma as unknown as { ping: () => void }).ping;
    proxiedPing();
    proxiedPing();

    expect(mocks.PrismaClient).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(2);
    expect(ping.mock.instances[0]).toBe(instance);
  });

  it("does not initialize the client for a promise-style then check", async () => {
    const { prisma } = await importSetup();

    expect((prisma as unknown as { then?: unknown }).then).toBeUndefined();
    expect(mocks.PrismaClient).not.toHaveBeenCalled();
  });
});
