/**
 * Tests for `apps/discordBot/src/core/dispatcher.ts`.
 *
 * The dispatcher only inspects type-guard methods and the interaction name/id,
 * so lightweight objects stand in for gateway payloads and no Discord connection
 * is needed. The real client collections are used to exercise the actual lookup
 * rules, including predicate `customId` values stored by the loader; only the
 * winston-backed logger is mocked.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Interaction } from "discord.js";
import { dsClient } from "../../../../apps/discordBot/src/core/client.js";
import { dispatchInteraction } from "../../../../apps/discordBot/src/core/dispatcher.js";
import type {
  Button,
  Command,
  Menu,
  Modal,
} from "../../../../apps/discordBot/src/types/interactions.js";
import { logger } from "shared";

vi.mock("shared", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

/** Interaction kinds produced by {@link interactionFor}. */
type InteractionKind = "command" | "button" | "menu" | "modal" | "other";

/**
 * Builds a minimal interaction payload with exactly one active type guard.
 *
 * @param kind - Which interaction branch should be taken by the dispatcher
 * @param id - Command name or raw custom id carried by the payload
 * @returns A payload shaped like the discord.js `Interaction` union
 */
function interactionFor(kind: InteractionKind, id = "target"): Interaction {
  return {
    isChatInputCommand: () => kind === "command",
    isButton: () => kind === "button",
    isStringSelectMenu: () => kind === "menu",
    isModalSubmit: () => kind === "modal",
    commandName: id,
    customId: id,
  } as unknown as Interaction;
}

beforeEach(() => {
  dsClient.buttons.clear();
  dsClient.commands.clear();
  dsClient.modals.clear();
  dsClient.menus.clear();
  vi.clearAllMocks();
});

describe("dispatchInteraction", () => {
  it("routes a chat input command by its registered name", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    dsClient.commands.set("ping", { data: { name: "ping" }, execute } as unknown as Command);

    await dispatchInteraction(interactionFor("command", "ping"));

    expect(execute).toHaveBeenCalledOnce();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("routes a button by its static custom id", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    dsClient.buttons.set("button:save", { customId: "button:save", execute });

    await dispatchInteraction(interactionFor("button", "button:save"));

    expect(execute).toHaveBeenCalledOnce();
  });

  it("matches a button whose registry key is a predicate", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const predicate = (id: string) => id.startsWith("dynamic:");
    dsClient.buttons.set(predicate as unknown as string, { customId: predicate, execute });

    await dispatchInteraction(interactionFor("button", "dynamic:42"));

    expect(execute).toHaveBeenCalledOnce();
  });

  it("matches a select menu whose handler declares a predicate custom id", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const menu = {
      customId: (id: string) => id.startsWith("menu:"),
      execute,
    } as unknown as Menu;
    dsClient.menus.set("menu-key", menu);

    await dispatchInteraction(interactionFor("menu", "menu:category"));

    expect(execute).toHaveBeenCalledOnce();
  });

  it("routes a modal submit by its static custom id", async () => {
    const execute = vi.fn();
    dsClient.modals.set("modal:setup", { customId: "modal:setup", execute });

    await dispatchInteraction(interactionFor("modal", "modal:setup"));

    expect(execute).toHaveBeenCalledOnce();
  });

  it("matches a modal whose handler declares a predicate custom id", async () => {
    const execute = vi.fn();
    const modal = {
      customId: (id: string) => id.endsWith(":setup"),
      execute,
    } as unknown as Modal;
    dsClient.modals.set("predicate-source", modal);

    await dispatchInteraction(interactionFor("modal", "wizard:setup"));

    expect(execute).toHaveBeenCalledOnce();
  });

  it("logs a warning and runs nothing when no handler is registered", async () => {
    await dispatchInteraction(interactionFor("command", "missing"));

    expect(logger.warn).toHaveBeenCalledWith("No command handler registered for: missing");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("warns for an unmatched custom id on each component kind", async () => {
    await dispatchInteraction(interactionFor("button", "unused:button"));
    await dispatchInteraction(interactionFor("menu", "unused:menu"));
    await dispatchInteraction(interactionFor("modal", "unused:modal"));

    expect(vi.mocked(logger.warn).mock.calls).toEqual([
      ["No button handler registered for: unused:button"],
      ["No menu handler registered for: unused:menu"],
      ["No modal handler registered for: unused:modal"],
    ]);
  });

  it("ignores interaction types without a dedicated handler", async () => {
    await expect(dispatchInteraction(interactionFor("other"))).resolves.toBeUndefined();

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs a rejected handler instead of propagating the error", async () => {
    const execute = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("handler broke"));
    dsClient.buttons.set("button:fail", { customId: "button:fail", execute } as Button);

    await expect(
      dispatchInteraction(interactionFor("button", "button:fail")),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith("Interaction handler failed: Error: handler broke");
  });
});
