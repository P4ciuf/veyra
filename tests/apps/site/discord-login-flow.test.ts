/**
 * Integration-style coverage of the Discord OAuth callback path.
 *
 * The real NextAuth `callbackHandler` drives an in-memory adapter wrapped by the
 * site's `createAuthAdapter`, then the test emits the `signIn` event that the
 * NextAuth route fires after that handler. Provider mapping, account lookup /
 * creation and id persistence therefore run in their production order. Only the
 * database boundary is replaced; no HTTP call or Discord credential is involved.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import callbackHandler from "next-auth/core/lib/callback-handler";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  persistDiscordId: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/services/auth", () => ({ getUser: mocks.getUser }));
vi.mock("shared", () => ({
  logger: { error: mocks.loggerError, warn: mocks.loggerWarn },
}));

import { buildAuthOptions } from "../../../apps/site/src/lib/authConfig";
import { createAuthAdapter } from "../../../apps/site/src/services/authAdapter";

/** Minimal environment; ids and secrets are placeholders, never real credentials. */
const env = {
  NEXTAUTH_URL: "https://veyra.example",
  DISCORD_CLIENT_ID: "dc-id",
  DISCORD_CLIENT_SECRET: "dc-secret",
};

/** Account row shape written by NextAuth for an OAuth identity. */
interface StoredAccount {
  provider: string;
  providerAccountId: string;
  userId: string;
  type: string;
}

/** In-memory stand-in for the Prisma adapter, with observable rows. */
function memoryAdapter(initialUsers: AdapterUser[] = []) {
  const users: AdapterUser[] = [...initialUsers];
  const accounts: StoredAccount[] = [];
  const adapter = {
    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) {
      const account = accounts.find(
        (item) => item.provider === provider && item.providerAccountId === providerAccountId,
      );
      return account ? (users.find((user) => user.id === account.userId) ?? null) : null;
    },
    async getUserByEmail(email: string) {
      return users.find((user) => user.email === email) ?? null;
    },
    async getUser(id: string) {
      return users.find((user) => user.id === id) ?? null;
    },
    async createUser(user: Record<string, unknown>) {
      const row = { ...user, id: `u-${users.length + 1}` } as AdapterUser;
      users.push(row);
      return row;
    },
    async linkAccount(account: StoredAccount) {
      accounts.push(account);
      return account;
    },
  } as unknown as Adapter;
  return { adapter, users, accounts };
}

/** Produces the mapped profile the real Discord provider would hand to NextAuth. */
function discordProfile(): AdapterUser {
  const options = buildAuthOptions(env, {} as Adapter, mocks.persistDiscordId);
  const provider = options.providers.find((item) => item.id === "discord") as {
    options?: { profile?: (profile: Record<string, unknown>) => AdapterUser };
    profile?: (profile: Record<string, unknown>) => AdapterUser;
  };
  const mapProfile = provider.options?.profile ?? provider.profile;
  if (!mapProfile) {
    throw new Error("Discord profile mapper is missing");
  }
  return mapProfile({
    id: "42",
    username: "player",
    global_name: "Player",
    email: "player@example.com",
  });
}

/** Runs the callback with the site's real options and wrapped adapter. */
async function runCallback(store: ReturnType<typeof memoryAdapter>, sessionUserId?: string) {
  const options = buildAuthOptions(env, createAuthAdapter(store.adapter), mocks.persistDiscordId);
  const profile = discordProfile();
  const account = { provider: "discord", providerAccountId: "42", type: "oauth" } as const;
  const result = await callbackHandler({
    sessionToken: sessionUserId ? "session-token" : undefined,
    profile: profile as never,
    account,
    options: {
      ...options,
      jwt: { decode: async () => (sessionUserId ? { sub: sessionUserId } : null) },
      provider: { allowDangerousEmailAccountLinking: false },
    } as never,
  });
  // `events.signIn` belongs to the route layer, which awaits it right after the
  // callback handler with the same profile and account objects.
  await options.events?.signIn?.({
    user: result.user,
    account,
    profile: profile as never,
    isNewUser: result.isNewUser,
  });
  return result;
}

/** Adapter user with a Discord identity pending, as created before the mapping existed. */
function legacyUser(): AdapterUser {
  return {
    id: "u-1",
    name: "Player",
    email: "player@example.com",
    image: null,
  } as AdapterUser;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Discord OAuth callback", () => {
  it("creates exactly one user with discordId on first login", async () => {
    const store = memoryAdapter();

    const result = await runCallback(store);

    expect(store.users).toHaveLength(1);
    expect(store.users[0]).toMatchObject({
      discordId: "42",
      username: "Player",
      email: "player@example.com",
    });
    expect(store.accounts).toMatchObject([
      { provider: "discord", providerAccountId: "42", userId: store.users[0]?.id },
    ]);
    expect(result.isNewUser).toBe(true);
    expect(mocks.persistDiscordId).toHaveBeenCalledWith(store.users[0]?.id, "42");
  });

  it("reuses the existing user and fills discordId on a returning login", async () => {
    const store = memoryAdapter([legacyUser()]);
    store.accounts.push({
      provider: "discord",
      providerAccountId: "42",
      userId: "u-1",
      type: "oauth",
    });

    const result = await runCallback(store);

    expect(store.users).toHaveLength(1);
    expect(store.accounts).toHaveLength(1);
    expect(result.isNewUser).toBe(false);
    expect(mocks.persistDiscordId).toHaveBeenCalledWith("u-1", "42");
  });

  it("links Discord to the signed-in user without creating a duplicate", async () => {
    const store = memoryAdapter([legacyUser()]);

    const result = await runCallback(store, "u-1");

    expect(store.users).toHaveLength(1);
    expect(store.accounts).toMatchObject([
      { provider: "discord", providerAccountId: "42", userId: "u-1" },
    ]);
    expect(result.isNewUser).toBe(false);
    expect(mocks.persistDiscordId).toHaveBeenCalledWith("u-1", "42");
  });

  it("completes the callback even when the id write fails", async () => {
    mocks.persistDiscordId.mockRejectedValueOnce(new Error("db down"));
    const store = memoryAdapter();

    const result = await runCallback(store);

    expect(result.user.id).toBeTruthy();
    expect(mocks.loggerError).toHaveBeenCalledWith("discord id persistence failed", {
      userId: result.user.id,
      error: "db down",
    });
  });
});
