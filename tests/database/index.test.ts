/**
 * Tests for `database/src/index.ts`, the public entry point of the `database`
 * workspace package.
 *
 * The suite imports the barrel by relative path and asserts its re-export
 * contract by identity, the same strategy as the `shared` barrel suite. The
 * two external modules are mocked: `@prisma/client` because the generated
 * client is an external boundary and the suite must not depend on
 * `prisma generate` having run, and `@prisma/adapter-pg` because it is a
 * database driver boundary. The barrel adds no logic of its own, so what must
 * be verified is that it forwards the mocked bindings by identity and does not
 * surface the `prisma` singleton from `src/setup.ts` (which would construct a
 * client and read configuration at import time).
 */
import { describe, expect, it, vi } from "vitest";

/** Mock exports shared between the `vi.mock` factories and the tests. */
const mocks = vi.hoisted(() => ({
  /** Stand-in for the `Prisma` namespace re-exported from `@prisma/client`. */
  prismaNamespace: { __prismaNamespace: true },
  /** Stand-in for `PrismaClient`, also re-exported by the barrel. */
  prismaClient: class PrismaClientStub {},
  /** Stand-in for the `PrismaPg` driver adapter re-exported from `@prisma/adapter-pg`. */
  prismaPg: { __prismaPg: true },
}));

vi.mock("@prisma/client", () => ({
  Prisma: mocks.prismaNamespace,
  PrismaClient: mocks.prismaClient,
}));

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: mocks.prismaPg }));

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

  it("does not export the prisma singleton from src/setup.ts", async () => {
    const mod = await import("../../database/src/index.js");

    expect("prisma" in mod).toBe(false);
  });
});
