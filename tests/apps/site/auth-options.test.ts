/**
 * Tests for the pure NextAuth configuration in `lib/authConfig.ts`.
 * The only mocked boundaries are the existing user lookup and hash service;
 * the provider objects built by NextAuth are inspected directly, so the tests
 * pin scopes, environment names, session policy and profile mapping.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Adapter, AdapterUser } from "next-auth/adapters";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  verifyHash: vi.fn(),
  persistDiscordId: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/services/auth", () => ({ getUser: mocks.getUser }));
vi.mock("@/services/hash", () => ({ verifyHash: mocks.verifyHash }));
vi.mock("shared", () => ({ logger: { error: mocks.loggerError } }));

import { buildAuthOptions, type AuthEnvironment } from "../../../apps/site/src/lib/authConfig";

/** Minimal adapter: the configuration builder never calls its methods. */
const adapter = {} as Adapter;

/** Complete environment snapshot with non-secret placeholder values. */
const env: AuthEnvironment = {
  GITHUB_CLIENT_ID: "gh-id",
  GITHUB_CLIENT_SECRET: "gh-secret",
  GOOGLE_CLIENT_ID: "go-id",
  GOOGLE_CLIENT_SECRET: "go-secret",
  DISCORD_CLIENT_ID: "dc-id",
  DISCORD_CLIENT_SECRET: "dc-secret",
  NEXTAUTH_URL: "https://veyra.example",
  NEXTAUTH_SECRET: "session-secret",
  NODE_ENV: "production",
};

/** Provider shape exposed by NextAuth's factory functions. */
interface TestProvider {
  id: string;
  name: string;
  type: string;
  authorization: string | { url?: string; params?: Record<string, string> };
  options?: Record<string, unknown>;
  profile?: (profile: Record<string, unknown>) => AdapterUser;
  authorize?: (credentials: Record<string, string>) => Promise<AdapterUser | null>;
}

/** Returns the registered providers with a narrow test-only shape. */
function providersFor(configEnv: AuthEnvironment = env): TestProvider[] {
  return buildAuthOptions(configEnv, adapter, mocks.persistDiscordId)
    .providers as unknown as TestProvider[];
}

/** Finds a provider by its NextAuth id. */
function provider(id: string): TestProvider {
  const found = providersFor().find((item) => item.id === id);
  if (!found) {
    throw new Error(`Provider ${id} is not registered`);
  }
  return found;
}

/** Reads the configured OAuth scope, preferring the caller's override. */
function scopeOf(item: TestProvider): string | undefined {
  const authorization = (item.options?.authorization ?? item.authorization) as
    string | { url?: string; params?: Record<string, string> } | undefined;
  if (!authorization) {
    return undefined;
  }
  if (typeof authorization === "string") {
    return new URL(authorization).searchParams.get("scope") ?? undefined;
  }
  return authorization.params?.scope;
}

/** Resolves the profile mapper that NextAuth will use after merging options. */
function profileOf(item: TestProvider): TestProvider["profile"] {
  return (item.options?.profile as TestProvider["profile"]) ?? item.profile;
}

/** Resolves the credentials authorizer that NextAuth will use after merging options. */
function authorizeOf(item: TestProvider): TestProvider["authorize"] {
  return (item.options?.authorize as TestProvider["authorize"]) ?? item.authorize;
}

describe("buildAuthOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers GitHub, Google, Discord and the existing credentials login", () => {
    expect(providersFor().map((item) => item.id)).toEqual([
      "github",
      "google",
      "discord",
      "credentials",
    ]);
    expect(provider("github").name).toBe("GitHub");
    expect(provider("google").name).toBe("Google");
    expect(provider("discord").name).toBe("Discord");
  });

  it("passes only identity and email scopes to each provider", () => {
    expect(scopeOf(provider("github"))).toBe("read:user user:email");
    expect(scopeOf(provider("google"))).toBe("openid email profile");
    expect(scopeOf(provider("discord"))).toBe("identify email");
  });

  it("reads each provider's documented environment variable names", () => {
    expect(provider("github").options?.clientId).toBe("gh-id");
    expect(provider("github").options?.clientSecret).toBe("gh-secret");
    expect(provider("google").options?.clientId).toBe("go-id");
    expect(provider("google").options?.clientSecret).toBe("go-secret");
    expect(provider("discord").options?.clientId).toBe("dc-id");
    expect(provider("discord").options?.clientSecret).toBe("dc-secret");
  });

  it("falls back to empty credentials so NextAuth reports a configuration error", () => {
    const incomplete = providersFor({ NEXTAUTH_URL: "http://localhost:3000" });
    expect(incomplete[0]?.options?.clientId).toBe("");
    expect(incomplete[0]?.options?.clientSecret).toBe("");
  });

  it("never enables email-based account linking", () => {
    for (const id of ["github", "google", "discord"]) {
      expect(provider(id).options?.allowDangerousEmailAccountLinking).toBeUndefined();
    }
  });

  it("uses JWT sessions so credentials and OAuth can coexist, and routes errors to sign-in", () => {
    const options = buildAuthOptions(env, adapter, mocks.persistDiscordId);
    expect(options.session?.strategy).toBe("jwt");
    expect(options.pages?.signIn).toBe("/signin");
    expect(options.pages?.signOut).toBe("/signout");
    expect(options.pages?.error).toBe("/signin");
    expect(options.secret).toBe("session-secret");
  });

  it("sets Secure cookies only for HTTPS deployments", () => {
    expect(buildAuthOptions(env, adapter, mocks.persistDiscordId).useSecureCookies).toBe(true);
    expect(
      buildAuthOptions(
        { ...env, NEXTAUTH_URL: "http://localhost:3000" },
        adapter,
        mocks.persistDiscordId,
      ).useSecureCookies,
    ).toBe(false);
  });

  it("maps provider profiles without throwing when the email is absent", () => {
    const github = profileOf(provider("github"))?.({
      id: 1,
      login: "octocat",
      name: "The Octocat",
      avatar_url: "https://avatars.example/1",
    });
    expect(github).toMatchObject({
      id: "1",
      name: "The Octocat",
      email: null,
      image: "https://avatars.example/1",
    });

    const google = profileOf(provider("google"))?.({ sub: "go-1", name: "Ada", email: "A@B.com" });
    expect(google).toMatchObject({ id: "go-1", name: "Ada", image: null });

    const discord = profileOf(provider("discord"))?.({
      id: "42",
      username: "player",
      discriminator: "2",
    });
    expect(discord).toMatchObject({
      id: "42",
      discordId: "42",
      name: "player",
      email: null,
      image: "https://cdn.discordapp.com/embed/avatars/2.png",
    });
  });

  it("uses the animated avatar format when Discord supplies one", () => {
    const discord = profileOf(provider("discord"))?.({
      id: "42",
      username: "player",
      avatar: "a_hash",
    });
    expect(discord?.image).toBe("https://cdn.discordapp.com/avatars/42/a_hash.gif");
  });

  it("keeps the existing credentials authorization behavior", async () => {
    const authorize = authorizeOf(provider("credentials"));
    expect(await authorize?.({})).toBeNull();

    mocks.getUser.mockResolvedValue({
      id: "user-1",
      username: "ada",
      email: "ada@example.com",
      avatarUrl: null,
      passwordHash: "hash",
    });
    mocks.verifyHash.mockResolvedValue(false);
    expect(await authorize?.({ email: "ada@example.com", password: "wrong" })).toBeNull();

    mocks.verifyHash.mockResolvedValue(true);
    expect(await authorize?.({ email: "ada@example.com", password: "correct" })).toMatchObject({
      id: "user-1",
      name: "ada",
      email: "ada@example.com",
    });
  });
});

/** Test-only view of the registered `signIn` event. */
type SignInEvent = (args: {
  user: { id: string };
  account: { provider: string } | null;
  profile?: Record<string, unknown>;
  isNewUser?: boolean;
}) => Promise<void>;

/** Reads the `signIn` event from a freshly built configuration. */
function signInEvent(): SignInEvent {
  const event = buildAuthOptions(env, adapter, mocks.persistDiscordId).events?.signIn;
  if (!event) {
    throw new Error("signIn event is not registered");
  }
  return event as SignInEvent;
}

describe("Discord sign-in persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the Discord id for a newly created user", async () => {
    await signInEvent()({
      user: { id: "user-1" },
      account: { provider: "discord" },
      profile: { id: "42", discordId: "42" },
      isNewUser: true,
    });
    expect(mocks.persistDiscordId).toHaveBeenCalledWith("user-1", "42");
  });

  it("updates the id on a returning user without creating a duplicate", async () => {
    await signInEvent()({
      user: { id: "user-1" },
      account: { provider: "discord" },
      profile: { id: "42", discordId: "42" },
      isNewUser: false,
    });
    expect(mocks.persistDiscordId).toHaveBeenCalledTimes(1);
    expect(mocks.persistDiscordId).toHaveBeenCalledWith("user-1", "42");
  });

  it("ignores non-Discord providers and credentials sign-ins", async () => {
    await signInEvent()({
      user: { id: "user-1" },
      account: { provider: "github" },
      profile: { discordId: "42" },
    });
    await signInEvent()({ user: { id: "user-1" }, account: null });
    expect(mocks.persistDiscordId).not.toHaveBeenCalled();
  });

  it("ignores a mapped profile without a usable Discord id", async () => {
    await signInEvent()({
      user: { id: "user-1" },
      account: { provider: "discord" },
      profile: { id: 42 },
    });
    expect(mocks.persistDiscordId).not.toHaveBeenCalled();
  });

  it("keeps sign-in working and logs when the persistence write fails", async () => {
    mocks.persistDiscordId.mockRejectedValueOnce(new Error("db down"));

    await expect(
      signInEvent()({
        user: { id: "user-1" },
        account: { provider: "discord" },
        profile: { discordId: "42" },
      }),
    ).resolves.toBeUndefined();

    expect(mocks.loggerError).toHaveBeenCalledWith("discord id persistence failed", {
      userId: "user-1",
      error: "db down",
    });
  });
});
