/**
 * Tests for `apps/site/src/app/api/auth/[...nextauth]/route.ts`.
 *
 * The module is wiring only: it builds the options through the pure helper,
 * wraps the Prisma adapter and forwards NextAuth's diagnostics to the shared
 * logger. Every collaborator is replaced because the real handler would start a
 * NextAuth request pipeline; the assertions pin that wiring and the logger
 * adapter. Recorders are plain closure arrays rather than `vi.fn()` spies: this
 * module is evaluated during collection, and the hoisted spy instance the
 * factories call is not the instance the test scope reads (see layout.test.tsx).
 */
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const baseAdapter = { id: "base-adapter" };
  const wrappedAdapter = { id: "wrapped-adapter" };
  const authOptions = { providers: [] as string[], adapter: wrappedAdapter };
  const handler = () => undefined;
  const prisma = { user: {} };
  const setUserDiscordId = () => undefined;
  const calls = {
    prismaAdapter: [] as unknown[][],
    createAuthAdapter: [] as unknown[][],
    buildAuthOptions: [] as unknown[][],
    nextAuth: [] as unknown[][],
    loggerError: [] as unknown[][],
    loggerWarn: [] as unknown[][],
    loggerDebug: [] as unknown[][],
  };

  return {
    baseAdapter,
    wrappedAdapter,
    authOptions,
    handler,
    prisma,
    setUserDiscordId,
    calls,
    prismaAdapter: (arg: unknown) => {
      calls.prismaAdapter.push([arg]);
      return baseAdapter;
    },
    createAuthAdapter: (arg: unknown) => {
      calls.createAuthAdapter.push([arg]);
      return wrappedAdapter;
    },
    buildAuthOptions: (env: unknown, adapter: unknown, persistDiscordId: unknown) => {
      calls.buildAuthOptions.push([env, adapter, persistDiscordId]);
      return authOptions;
    },
    nextAuth: (options: unknown) => {
      calls.nextAuth.push([options]);
      return handler;
    },
    loggerError: (...args: unknown[]) => {
      calls.loggerError.push(args);
    },
    loggerWarn: (...args: unknown[]) => {
      calls.loggerWarn.push(args);
    },
    loggerDebug: (...args: unknown[]) => {
      calls.loggerDebug.push(args);
    },
  };
});

vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: mocks.prismaAdapter }));
vi.mock("database", () => ({ prisma: mocks.prisma }));
vi.mock("next-auth", () => ({ default: mocks.nextAuth }));
vi.mock("shared", () => ({
  logger: { error: mocks.loggerError, warn: mocks.loggerWarn, debug: mocks.loggerDebug },
}));
vi.mock("@/lib/authConfig", () => ({ buildAuthOptions: mocks.buildAuthOptions }));
vi.mock("@/services/authAdapter", () => ({ createAuthAdapter: mocks.createAuthAdapter }));
vi.mock("@/services/auth", () => ({ setUserDiscordId: mocks.setUserDiscordId }));

import { GET, POST } from "../../../../../apps/site/src/app/api/auth/[...nextauth]/route.js";

/** Diagnostic logger shape injected into NextAuth by the route. */
type AuthLogger = {
  error: (code: string, metadata: unknown) => void;
  warn: (code: string) => void;
  debug: (code: string, metadata: unknown) => void;
};

/** Reads the options object NextAuth received at module evaluation. */
function nextAuthOptions(): Record<string, unknown> {
  return mocks.calls.nextAuth[0]?.[0] as Record<string, unknown>;
}

describe("NextAuth catch-all route", () => {
  it("exports the same handler for GET and POST", () => {
    expect(GET).toBe(POST);
    expect(GET).toBe(mocks.handler);
  });

  it("wires the wrapped Prisma adapter and the environment into the options builder", () => {
    expect(mocks.calls.prismaAdapter).toEqual([[mocks.prisma]]);
    expect(mocks.calls.createAuthAdapter).toEqual([[mocks.baseAdapter]]);
    expect(mocks.calls.buildAuthOptions).toEqual([
      [process.env, mocks.wrappedAdapter, mocks.setUserDiscordId],
    ]);

    const options = nextAuthOptions();
    expect(options.adapter).toBe(mocks.wrappedAdapter);
    expect(options.providers).toBe(mocks.authOptions.providers);
  });

  it("forwards NextAuth diagnostics to the shared logger", () => {
    const logger = nextAuthOptions().logger as AuthLogger;
    expect(logger).toBeTruthy();

    logger.error("OAuthCallback", { detail: 1 });
    expect(mocks.calls.loggerError).toEqual([
      ["auth error", { code: "OAuthCallback", metadata: { detail: 1 } }],
    ]);

    logger.warn("MissingSecret");
    expect(mocks.calls.loggerWarn).toEqual([["MissingSecret"]]);

    logger.debug("EVENT", { id: 7 });
    expect(mocks.calls.loggerDebug).toEqual([["auth", { code: "EVENT", metadata: { id: 7 } }]]);
  });
});
