/**
 * Gateway event that bridges Discord interactions to the loaded handlers.
 *
 * The event module is auto-discovered by `Loaders` from `src/events`, so the
 * dispatcher is subscribed before the client logs in. The argument is checked
 * structurally instead of with `instanceof`: loader tests and future tests can
 * feed lightweight interaction objects without a real gateway connection.
 */
import type { Interaction } from "discord.js";
import { dispatchInteraction } from "../core/dispatcher.js";
import type { Event } from "../types/interactions.js";

/** Forwards every `interactionCreate` payload to the central dispatcher. */
const interactionCreate: Event = {
  /** Gateway event name subscribed by the loader. */
  name: "interactionCreate",
  /**
   * Handles one gateway payload.
   *
   * @param args - Gateway arguments; only the first one is an interaction
   * @returns Resolves after the matching handler has run
   */
  async execute(...args: unknown[]): Promise<void> {
    const [interaction] = args;
    if (
      interaction &&
      typeof (interaction as Partial<Interaction>).isChatInputCommand === "function"
    ) {
      await dispatchInteraction(interaction as Interaction);
    }
  },
};

export default interactionCreate;
