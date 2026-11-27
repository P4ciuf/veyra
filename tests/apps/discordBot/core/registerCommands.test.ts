/**
 * Tests for `apps/discordBot/src/core/registerCommands.ts`.
 *
 * The REST boundary is replaced by spies on `REST.prototype` so no network call
 * is made, while `Routes` and the command collection stay real. The assertions
 * pin the published body, the application-id route, the token and the failure
 * policy (log and continue rather than abort the boot).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { REST, Routes } from "discord.js";
import { dsClient } from "../../../../apps/discordBot/src/core/client.js";
import { registerCommands } from "../../../../apps/discordBot/src/core/registerCommands.js";
import type { Command } from "../../../../apps/discordBot/src/types/interactions.js";
import { logger } from "shared";

const mocks = vi.hoisted(() => ({
  env: {
    token: undefined as string | undefined,
    clientId: undefined as string | undefined,
    nodeEnv: "production",
  },
}));

vi.mock("../../../../apps/discordBot/src/config/env.js", () => ({ ENV: mocks.env }));
vi.mock("shared", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe("registerCommands", () => {
  let putSpy: MockInstance;
  let setTokenSpy: MockInstance;

  beforeEach(() => {
    dsClient.commands.clear();
    mocks.env.token = "token-value";
    mocks.env.clientId = "client-id";
    vi.clearAllMocks();
    putSpy = vi.spyOn(REST.prototype, "put").mockResolvedValue({} as never);
    setTokenSpy = vi.spyOn(REST.prototype, "setToken");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes the JSON of every loaded command to the application command route", async () => {
    const json = { name: "ping", description: "Replies with pong" };
    dsClient.commands.set("ping", {
      data: { toJSON: () => json },
      execute: vi.fn(),
    } as unknown as Command);

    await expect(registerCommands()).resolves.toBe(true);

    expect(setTokenSpy).toHaveBeenCalledWith("token-value");
    expect(putSpy).toHaveBeenCalledWith(Routes.applicationCommands("client-id"), {
      body: [json],
    });
    expect(logger.info).toHaveBeenCalledWith("✓ Registered 1 slash commands");
  });

  it("synchronizes an empty command set when no module was loaded", async () => {
    await expect(registerCommands()).resolves.toBe(true);

    expect(putSpy).toHaveBeenCalledWith(Routes.applicationCommands("client-id"), { body: [] });
  });

  it("logs a failed REST call and reports false without throwing", async () => {
    putSpy.mockRejectedValue(new Error("429 Too Many Requests"));

    await expect(registerCommands()).resolves.toBe(false);

    expect(logger.error).toHaveBeenCalledWith(
      "Slash command registration failed: Error: 429 Too Many Requests",
    );
  });

  it("skips registration when credentials are missing", async () => {
    mocks.env.token = undefined;

    await expect(registerCommands()).resolves.toBe(false);

    expect(putSpy).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Slash command registration skipped: missing credentials",
    );
  });
});
