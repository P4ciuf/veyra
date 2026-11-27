/**
 * Tests for `apps/site/src/services/accountProviders.ts`.
 *
 * Only the Prisma singleton is mocked: the real provider allowlist and the
 * service's business rules are exercised. The safety rule matters here: a
 * passwordless user with one linked provider must never be able to remove the
 * only way back into the account.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Prisma calls recorded by the mocked account and user delegates. */
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("database", () => ({
  prisma: {
    account: { findMany: mocks.findMany, deleteMany: mocks.deleteMany },
    user: { findUnique: mocks.findUnique },
  },
}));

import {
  listLinkedProviders,
  unlinkProvider,
} from "../../../apps/site/src/services/accountProviders.js";

/** Builds the user shape selected by `unlinkProvider`. */
const userWith = (providers: string[], passwordHash: string | null = null) => ({
  passwordHash,
  accounts: providers.map((provider) => ({ provider })),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([]);
  mocks.findUnique.mockResolvedValue(userWith(["github"], "hash"));
  mocks.deleteMany.mockResolvedValue({ count: 1 });
});

describe("listLinkedProviders", () => {
  it("returns only registered providers in the configured order", async () => {
    mocks.findMany.mockResolvedValue([
      { provider: "discord" },
      { provider: "unknown-provider" },
      { provider: "github" },
    ]);

    await expect(listLinkedProviders("user-1")).resolves.toEqual(["github", "discord"]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { provider: true },
    });
  });
});

describe("unlinkProvider", () => {
  it("rejects an id outside the registered provider list without touching the database", async () => {
    await expect(unlinkProvider("user-1", "twitter")).resolves.toBe("invalid-provider");

    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("reports an unknown user from a stale session", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(unlinkProvider("user-1", "github")).resolves.toBe("unknown-user");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses to unlink a provider that is not linked", async () => {
    mocks.findUnique.mockResolvedValue(userWith(["google"], "hash"));

    await expect(unlinkProvider("user-1", "github")).resolves.toBe("not-linked");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("protects the last sign-in method of a passwordless user", async () => {
    mocks.findUnique.mockResolvedValue(userWith(["discord"], null));

    await expect(unlinkProvider("user-1", "discord")).resolves.toBe("last-sign-in-method");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("allows unlinking when the user still has a password", async () => {
    mocks.findUnique.mockResolvedValue(userWith(["github"], "hash"));

    await expect(unlinkProvider("user-1", "github")).resolves.toBe("unlinked");
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", provider: "github" },
    });
  });

  it("allows unlinking when another provider remains", async () => {
    mocks.findUnique.mockResolvedValue(userWith(["github", "google"], null));

    await expect(unlinkProvider("user-1", "github")).resolves.toBe("unlinked");
    expect(mocks.deleteMany).toHaveBeenCalledOnce();
  });

  it("reports not-linked when the row was already removed concurrently", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    await expect(unlinkProvider("user-1", "github")).resolves.toBe("not-linked");
  });
});
