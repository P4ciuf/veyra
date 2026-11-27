/**
 * Routes incoming Discord interactions to the handlers registered by the loader.
 *
 * The loader stores slash commands by name and buttons, select menus and modals
 * by `customId`. A `customId` may also be a predicate: buttons keep the function
 * as the collection key, while menus and modals keep the original function on
 * the handler object. Both shapes are supported here so dynamic ids work for
 * every interaction kind.
 */
import type { Interaction } from "discord.js";
import { logger } from "shared";
import { dsClient } from "./client.js";
import type { Button, Menu, Modal } from "../types/interactions.js";

/** Static id or predicate over the raw interaction id. */
type CustomId = string | ((id: string) => boolean);

/** Minimal shape shared by every handler that can be matched by `customId`. */
interface CustomIdHandler {
  /** Static id or predicate stored by the loader. */
  customId?: CustomId;
}

/**
 * Finds a handler for a raw `customId`, trying the static key first and then
 * every predicate stored as a key or on the handler itself.
 *
 * @param registry - Loaded handlers keyed by their static or dynamic id
 * @param customId - Raw id received from the interaction
 * @returns The first matching handler, or `undefined` when none is registered
 */
function findCustomIdHandler<T extends CustomIdHandler>(
  registry: Map<unknown, T>,
  customId: string,
): T | undefined {
  const direct = registry.get(customId);
  if (direct) {
    return direct;
  }

  for (const [key, handler] of registry) {
    const keyPredicate = key as CustomId;
    const predicate = typeof keyPredicate === "function" ? keyPredicate : handler.customId;
    if (typeof predicate === "function" && predicate(customId)) {
      return handler;
    }
  }

  return undefined;
}

/**
 * Dispatches one interaction to its registered handler.
 *
 * Unknown and unhandled interaction types are ignored; a missing handler and a
 * failing handler are logged through the shared logger instead of throwing, so
 * one bad module cannot break the event listener for later interactions.
 *
 * @param interaction - Interaction emitted by Discord
 * @async
 * @example
 * dsClient.on("interactionCreate", (interaction) => void dispatchInteraction(interaction));
 */
export async function dispatchInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = dsClient.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`No command handler registered for: ${interaction.commandName}`);
        return;
      }
      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      const button = findCustomIdHandler<Button>(
        dsClient.buttons as unknown as Map<unknown, Button>,
        interaction.customId,
      );
      if (!button) {
        logger.warn(`No button handler registered for: ${interaction.customId}`);
        return;
      }
      await button.execute(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const menu = findCustomIdHandler<Menu>(
        dsClient.menus as unknown as Map<unknown, Menu>,
        interaction.customId,
      );
      if (!menu) {
        logger.warn(`No menu handler registered for: ${interaction.customId}`);
        return;
      }
      await menu.execute(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      const modal = findCustomIdHandler<Modal>(
        dsClient.modals as unknown as Map<unknown, Modal>,
        interaction.customId,
      );
      if (!modal) {
        logger.warn(`No modal handler registered for: ${interaction.customId}`);
        return;
      }
      // Modal handlers are declared synchronous; awaiting also covers async ones.
      await modal.execute(interaction);
    }
  } catch (err) {
    logger.error(`Interaction handler failed: ${String(err)}`);
  }
}
