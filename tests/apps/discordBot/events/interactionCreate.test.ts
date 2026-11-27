/**
 * Tests for the auto-loaded `interactionCreate` event module.
 *
 * The module is the bridge between the loader's event subscription and the
 * dispatcher, so the dispatcher is mocked here: the test only checks that real
 * interaction-like payloads are forwarded and that unrelated gateway arguments
 * are ignored.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Interaction } from "discord.js";

const mocks = vi.hoisted(() => ({ dispatch: vi.fn<() => Promise<void>>() }));

vi.mock("../../../../apps/discordBot/src/core/dispatcher.js", () => ({
  dispatchInteraction: mocks.dispatch,
}));

import interactionCreate from "../../../../apps/discordBot/src/events/interactionCreate.js";

/** Minimal payload accepted by the event's structural interaction check. */
const payload = { isChatInputCommand: () => true } as unknown as Interaction;

beforeEach(() => {
  mocks.dispatch.mockReset();
  mocks.dispatch.mockResolvedValue(undefined);
});

describe("interactionCreate event", () => {
  it("subscribes to the gateway event name the loader looks for", () => {
    expect(interactionCreate.name).toBe("interactionCreate");
    expect(interactionCreate.once).toBeUndefined();
  });

  it("forwards the interaction to the dispatcher", async () => {
    await interactionCreate.execute(payload);

    expect(mocks.dispatch).toHaveBeenCalledWith(payload);
  });

  it("ignores non-interaction gateway arguments", async () => {
    await interactionCreate.execute(undefined, "not an interaction");

    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it("awaits the dispatcher before resolving", async () => {
    let release!: () => void;
    mocks.dispatch.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const running = interactionCreate.execute(payload);
    await Promise.resolve();
    expect(mocks.dispatch).toHaveBeenCalledOnce();

    release();
    await expect(running).resolves.toBeUndefined();
  });
});
