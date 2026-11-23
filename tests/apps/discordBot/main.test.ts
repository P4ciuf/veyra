/**
 * Tests for `apps/discordBot/src/main.ts`.
 *
 * The entrypoint runs all of its side effects at import time (credential check,
 * boot IIFE, signal handler registration), so every test re-imports the module
 * fresh with `vi.resetModules()` after arranging the mocked collaborators.
 *
 * The collaborators are replaced wholesale with `vi.mock`: the shared logger
 * (winston writes rotating files to disk), the loader (would scan real
 * directories), the Discord client (`login` performs real network I/O), the
 * shutdown routine and `ENV` (avoids dotenv side effects). The mock paths are
 * resolved relative to this test file and map onto the same module ids that
 * `main.ts` imports with its relative specifiers.
 *
 * `process.exit` is mocked as a no-op in every test so an unexpected exit can
 * never kill the Vitest worker; the missing-credentials test overrides it with
 * an implementation that throws, which faithfully reproduces the halting
 * behavior of a real exit (the import rejects instead of continuing into the
 * boot sequence) while keeping the thrown status observable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

/** Mock collaborators shared between the `vi.mock` factories and the tests. */
const mocks = vi.hoisted(() => ({
  /** Four-level logger facade replacing the real winston-backed one. */
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  /** `Loaders.LoadAll` of the class instantiated by the boot IIFE. */
  loadAll: vi.fn<() => Promise<void>>(),
  /** `dsClient.login`, called with the token from the (mocked) ENV. */
  login: vi.fn<(token: string) => Promise<void>>(),
  /** Graceful teardown, called by the exit path and the signal handlers. */
  shutdown: vi.fn<() => Promise<void>>(),
  /** Mutable ENV snapshot; tests assign credentials before the import. */
  env: {
    token: undefined as string | undefined,
    clientId: undefined as string | undefined,
    nodeEnv: "production",
  },
}));

vi.mock("shared", () => ({ logger: mocks.logger }));

vi.mock("../../../apps/discordBot/src/core/loader.js", () => ({
  // A class (not a plain object) because `main.ts` instantiates it with `new`;
  // the instance field forwards to the hoisted spy.
  Loaders: class {
    LoadAll = mocks.loadAll;
  },
}));

vi.mock("../../../apps/discordBot/src/core/client.js", () => ({
  dsClient: { login: mocks.login, user: { username: "veyra-test" } },
}));

vi.mock("../../../apps/discordBot/src/config/env.js", () => ({ ENV: mocks.env }));

vi.mock("../../../apps/discordBot/src/core/shutdown.js", () => ({ shutdown: mocks.shutdown }));

/** Imports the entrypoint under test through the Vite resolver (`.js` → `.ts`). */
const importMain = (): Promise<typeof import("../../../apps/discordBot/src/main.js")> =>
  import("../../../apps/discordBot/src/main.js");

/** Handler signature of the SIGINT/SIGTERM listeners registered by `main.ts`. */
type SignalHandler = (...args: unknown[]) => unknown;

describe("main entrypoint", () => {
  let exitSpy: MockInstance;
  let onSpy: MockInstance;
  let savedExitCode: typeof process.exitCode;

  beforeEach(() => {
    savedExitCode = process.exitCode;
    vi.resetModules();
    vi.clearAllMocks();
    mocks.env.token = undefined;
    mocks.env.clientId = undefined;
    mocks.loadAll.mockResolvedValue(undefined);
    mocks.login.mockResolvedValue(undefined);
    mocks.shutdown.mockResolvedValue(undefined);
    // Defensive no-op: a stray real `process.exit` would terminate the worker.
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    // Kept pass-through so registrations stay real; only the calls are recorded.
    onSpy = vi.spyOn(process, "on");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.exitCode = savedExitCode;
  });

  it("logs the failure, tears down and exits with status 1 when credentials are missing", async () => {
    // Throwing (instead of returning) halts module evaluation exactly like a
    // real exit would, so the import rejects with the simulated status.
    exitSpy.mockImplementation((code: number | string | null | undefined) => {
      throw new Error(`process.exit(${String(code)})`);
    });

    await expect(importMain()).rejects.toThrow("process.exit(1)");

    expect(mocks.logger.error).toHaveBeenCalledWith("Client ID or Token not found");
    expect(mocks.shutdown).toHaveBeenCalled();
    // The boot IIFE must never have started on the failure path.
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("loads modules, logs in with the configured token and logs the username", async () => {
    mocks.env.token = "token-value";
    mocks.env.clientId = "client-id-value";

    await importMain();

    await vi.waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith("token-value");
    });
    expect(mocks.loadAll).toHaveBeenCalledTimes(1);
    // The loader runs before the login: module auto-loading precedes Discord login.
    expect(mocks.loadAll.mock.invocationCallOrder[0]!).toBeLessThan(
      mocks.login.mock.invocationCallOrder[0]!,
    );
    expect(mocks.logger.info).toHaveBeenCalledWith("Client logged in as: veyra-test");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("logs the initialization error instead of crashing when login is rejected", async () => {
    mocks.env.token = "token-value";
    mocks.env.clientId = "client-id-value";
    mocks.login.mockRejectedValue(new Error("Used disallowed intents"));

    await importMain();

    await vi.waitFor(() => {
      expect(mocks.logger.error).toHaveBeenCalledWith(
        "Bot initialization error: Error: Used disallowed intents",
      );
    });
    // The process must survive a rejected login (the signal handlers stay alive).
    expect(exitSpy).not.toHaveBeenCalled();
    // And the boot error path must not tear the client down by itself.
    expect(mocks.shutdown).not.toHaveBeenCalled();
  });

  it("shuts down gracefully when SIGINT is received", async () => {
    mocks.env.token = "token-value";
    mocks.env.clientId = "client-id-value";

    await importMain();

    const handler = lastHandlerFor("SIGINT");
    await handler();

    expect(mocks.logger.info).toHaveBeenCalledWith("SIGINT");
    expect(mocks.shutdown).toHaveBeenCalled();
  });

  it("shuts down gracefully when SIGTERM is received", async () => {
    mocks.env.token = "token-value";
    mocks.env.clientId = "client-id-value";

    await importMain();

    const handler = lastHandlerFor("SIGTERM");
    await handler();

    expect(mocks.logger.info).toHaveBeenCalledWith("SIGTERM");
    expect(mocks.shutdown).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  /**
   * Extracts the signal handler registered by the import of the current test.
   * The spy is installed in `beforeEach`, so the recorded calls only contain
   * the registrations of the module instance imported in the running test —
   * earlier imports of previous tests are not visible here. Invoking the
   * captured handler directly (instead of emitting a real process signal)
   * avoids delivering the event to handlers left over from earlier tests.
   *
   * @param signal - Signal name whose handler was registered by `main.ts`.
   * @returns The registered handler, awaited by the calling test.
   */
  function lastHandlerFor(signal: string): SignalHandler {
    const registrations = onSpy.mock.calls.filter(([name]) => name === signal);

    expect(registrations).toHaveLength(1);
    return registrations[0]![1] as SignalHandler;
  }
});
