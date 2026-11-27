/**
 * Tests for `database/src/index.ts`, the public entry point of the `database`
 * workspace package.
 *
 * The suite imports the barrel by relative path and asserts its re-export
 * contract by identity, the same strategy as the `shared` barrel suite. The
 * two external modules are mocked: `@prisma/client` because the generated
 * client is an external boundary and the suite must not depend on
 * `prisma generate` having run, and `@prisma/adapter-pg` because it is a
 * database driver boundary. `src/env.ts` is mocked with a placeholder
 * connection string because the barrel also re-exports the `prisma` singleton
 * from `src/setup.ts`; the singleton is lazy, so no client is constructed until
 * one of its properties is read, but the collaborators still need stand-ins.
 */
import { describe, expect, it, vi } from "vitest";

/** Mock exports shared between the `vi.mock` factories and the tests. */
const mocks = vi.hoisted(() => ({
  /** Stand-in for the `Prisma` namespace re-exported from `@prisma/client`. */
  prismaNamespace: { __prismaNamespace: true },
  /** Stand-in for `PrismaClient`, also re-exported by the barrel. */
  prismaClient: class PrismaClientStub {},
  /** Constructor stand-in used when the lazy client is first accessed. */
  prismaPg: class PrismaPgStub {},
  /** Env snapshot available to `setup.ts` if a test accesses the client. */
  env: { databaseUrl: "postgres://user:password@localhost:5432/veyra" },
}));

vi.mock("@prisma/client", () => ({
  Prisma: mocks.prismaNamespace,
  PrismaClient: mocks.prismaClient,
}));

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mocks.prismaPg }));

vi.mock("../../database/src/env.js", () => ({ ENV: mocks.env }));

describe("database entry point", () => {
  it("re-exports the Prisma namespace from @prisma/client", async () => {
    const { Prisma } = await import("../../database/src/index.js");

    expect(Prisma).toBe(mocks.prismaNamespace);
  });

  it("re-exports the PrismaPg driver adapter from @prisma/adapter-pg", async () => {
    const { PrismaPg } = await import("../../database/src/index.js");

    expect(PrismaPg).toBe(mocks.prismaPg);
  });

  it("re-exports PrismaClient from @prisma/client", async () => {
    const { PrismaClient } = await import("../../database/src/index.js");

    expect(PrismaClient).toBe(mocks.prismaClient);
  });

  it("re-exports the prisma singleton built by src/setup.ts", async () => {
    const { prisma } = await import("../../database/src/index.js");
    const { prisma: setupPrisma } = await import("../../database/src/setup.js");

    // The barrel forwards the exact lazy singleton from setup.ts, not a new client.
    expect(prisma).toBe(setupPrisma);
    expect(prisma).toBeInstanceOf(mocks.prismaClient);
  });
});
