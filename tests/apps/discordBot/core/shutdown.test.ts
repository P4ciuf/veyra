/**
 * Tests for `apps/discordBot/src/core/shutdown.ts`.
 * `dsClient.destroy` is spied on the real singleton so the success and failure
 * branches are both observable; the shared logger is mocked to avoid file I/O.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

vi.mock("shared", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { shutdown } from "../../../../apps/discordBot/src/core/shutdown.js";
import { dsClient } from "../../../../apps/discordBot/src/core/client.js";
import { logger } from "shared";

describe("shutdown", () => {
  let destroySpy: MockInstance;

  beforeEach(() => {
    destroySpy = vi.spyOn(dsClient, "destroy").mockResolvedValue(undefined);
  });

  afterEach(() => {
    destroySpy.mockRestore();
    vi.clearAllMocks();
  });

  it("destroys the client and logs success", async () => {
    await expect(shutdown()).resolves.toBeUndefined();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("Client successfully destroyed");
  });

  it("logs an error instead of throwing when destroy fails", async () => {
    destroySpy.mockRejectedValue(new Error("socket hang up"));

    await expect(shutdown()).resolves.toBeUndefined();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      "Bot shutdown error: Error: socket hang up",
    );
  });
});
