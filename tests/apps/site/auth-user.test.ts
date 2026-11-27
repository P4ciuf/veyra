/**
 * Tests for the platform-user mapping applied to first-time OAuth users.
 * `completePlatformUser` is pure; `createAuthAdapter` is exercised with a stub
 * adapter so no database or Prisma client is involved.
 */
import { describe, expect, it, vi } from "vitest";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { completePlatformUser } from "../../../apps/site/src/lib/authUser";
import { createAuthAdapter } from "../../../apps/site/src/services/authAdapter";

describe("completePlatformUser", () => {
  it("uses the display name and mirrors the provider avatar", () => {
    expect(
      completePlatformUser({
        name: "Octocat",
        email: "octo@example.com",
        image: "https://avatars.example/1",
        emailVerified: null,
      }),
    ).toEqual({ username: "Octocat", avatarUrl: "https://avatars.example/1" });
  });

  it("falls back to the email local part when the provider omits the name", () => {
    expect(completePlatformUser({ email: "ada@example.com", emailVerified: null })).toEqual({
      username: "ada",
      avatarUrl: null,
    });
  });

  it("generates a local-style username when neither name nor email is present", () => {
    const result = completePlatformUser({ email: null, emailVerified: null });
    expect(result.username).toMatch(/^user-[0-9a-f]{24}$/);
    expect(result.avatarUrl).toBeNull();
  });
});

describe("createAuthAdapter", () => {
  it("fills platform columns before delegating createUser", async () => {
    const createUser = vi.fn(async (user) => ({ ...user, id: "new-id" }) as AdapterUser);
    const base: Adapter = { createUser };
    const wrapped = createAuthAdapter(base) as {
      createUser?: (user: Record<string, unknown>) => Promise<AdapterUser>;
    };

    await wrapped.createUser?.({
      name: "Grace",
      email: "grace@example.com",
      image: "https://avatars.example/2",
      emailVerified: null,
    });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "Grace",
        avatarUrl: "https://avatars.example/2",
        email: "grace@example.com",
      }),
    );
  });

  it("forwards the Discord id to the underlying adapter", async () => {
    const createUser = vi.fn(async (user) => ({ ...user, id: "new-id" }) as AdapterUser);
    const wrapped = createAuthAdapter({ createUser }) as {
      createUser?: (user: Record<string, unknown>) => Promise<AdapterUser>;
    };

    await wrapped.createUser?.({
      name: "Player",
      email: "player@example.com",
      image: null,
      emailVerified: null,
      discordId: "42",
    });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ discordId: "42", username: "Player" }),
    );
  });

  it("passes other adapter methods through unchanged", () => {
    const base: Adapter = { getUser: vi.fn(async () => null) };
    const wrapped = createAuthAdapter(base);
    expect(wrapped.getUser).toBe(base.getUser);
  });

  it("returns the adapter untouched when it has no createUser method", () => {
    const base: Adapter = {};
    expect(createAuthAdapter(base)).toBe(base);
  });
});
