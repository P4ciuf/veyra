/**
 * Tests for `apps/site/src/services/auth.ts`.
 *
 * The database barrel and the hashing helper are the only boundaries: mocking
 * `database` keeps the generated Prisma client out of the process (its lazy
 * singleton would construct one on first property access) and Argon2 is a native
 * binding. Everything else — filter forwarding, generated usernames, password
 * hashing and field precedence — is exercised directly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  createHash: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("shared", () => ({ logger: { warn: mocks.loggerWarn } }));

vi.mock("database", () => ({
  Prisma: {},
  prisma: {
    user: { findFirst: mocks.findFirst, create: mocks.create, updateMany: mocks.updateMany },
  },
}));

vi.mock("../../../apps/site/src/services/hash", () => ({ createHash: mocks.createHash }));

import { createUser, getUser, setUserDiscordId } from "../../../apps/site/src/services/auth";

/** Reads the Prisma `data` argument captured by the create mock. */
function createdData(): Record<string, unknown> {
  const call = mocks.create.mock.calls[0];
  return (call?.[0] as { data: Record<string, unknown> } | undefined)?.data ?? {};
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createHash.mockResolvedValue("hashed-password");
});

describe("getUser", () => {
  it("queries the first user matching the given filter", async () => {
    const row = { id: "u-1", email: "ada@example.com" };
    mocks.findFirst.mockResolvedValue(row);

    await expect(getUser({ email: "ada@example.com" })).resolves.toBe(row);
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { email: "ada@example.com" } });
  });

  it("returns null when no user matches", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(getUser({ email: "missing@example.com" })).resolves.toBeNull();
  });
});

describe("createUser", () => {
  it("hashes the plaintext password and generates a username", async () => {
    mocks.create.mockImplementation(async ({ data }) => ({ id: "u-2", ...data }));

    const result = await createUser({ email: "ada@example.com", password: "secret" });

    expect(mocks.createHash).toHaveBeenCalledWith("secret");
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(createdData().email).toBe("ada@example.com");
    expect(createdData().username).toMatch(/^user-[0-9a-f]{24}$/);
    expect(createdData().passwordHash).toBe("hashed-password");
    expect(createdData()).not.toHaveProperty("password");
    expect(result).toMatchObject({ email: "ada@example.com", passwordHash: "hashed-password" });
  });

  it("passes only User columns to Prisma, never the plaintext password", async () => {
    mocks.create.mockImplementation(async ({ data }) => ({ id: "u-4", ...data }));

    const input = {
      email: "ada@example.com",
      password: "secret",
      username: "ada",
      avatarUrl: "https://avatars.example/ada",
      discordId: "not-a-user-column",
    } as Parameters<typeof createUser>[0] & { discordId: string };

    await createUser(input);

    expect(createdData()).toEqual({
      email: "ada@example.com",
      username: "ada",
      avatarUrl: "https://avatars.example/ada",
      passwordHash: "hashed-password",
    });
    expect(createdData()).not.toHaveProperty("password");
    expect(createdData()).not.toHaveProperty("discordId");
  });

  it("prefers explicit profile fields over generated defaults", async () => {
    mocks.create.mockImplementation(async ({ data }) => ({ id: "u-3", ...data }));

    await createUser({
      email: "ada@example.com",
      password: "secret",
      username: "ada",
      avatarUrl: "https://avatars.example/ada",
    });

    expect(createdData().username).toBe("ada");
    expect(createdData().avatarUrl).toBe("https://avatars.example/ada");
    expect(createdData().passwordHash).toBe("hashed-password");
  });

  it("propagates a database failure", async () => {
    mocks.create.mockRejectedValue(new Error("db down"));

    await expect(createUser({ email: "ada@example.com", password: "secret" })).rejects.toThrow(
      "db down",
    );
  });
});

describe("setUserDiscordId", () => {
  beforeEach(() => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("updates the existing user row when the Discord id is missing", async () => {
    await expect(setUserDiscordId("u-1", "42")).resolves.toBe(true);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { discordId: "42", id: { not: "u-1" } },
      select: { id: true },
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "u-1",
        OR: [{ discordId: null }, { discordId: { not: "42" } }],
      },
      data: { discordId: "42" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("overwrites a different Discord id through the same idempotent filter", async () => {
    await expect(setUserDiscordId("u-1", "43")).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ discordId: null }, { discordId: { not: "43" } }],
        }),
        data: { discordId: "43" },
      }),
    );
  });

  it("reports and logs a conflict instead of silently skipping the write", async () => {
    mocks.findFirst.mockResolvedValue({ id: "u-2" });

    await expect(setUserDiscordId("u-1", "42")).resolves.toBe(false);

    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.loggerWarn).toHaveBeenCalledWith("Discord id is already linked to another user", {
      userId: "u-1",
      ownerUserId: "u-2",
    });
  });

  it("propagates a database failure", async () => {
    mocks.updateMany.mockRejectedValue(new Error("db down"));

    await expect(setUserDiscordId("u-1", "42")).rejects.toThrow("db down");
  });
});
