import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

/**
 * A slash command module as the loader expects it.
 * Registered on the client under `data.name`; `execute` is invoked with the
 * `ChatInputCommandInteraction` when a user runs the command.
 */
export interface Command {
  /** Slash command definition produced by a `SlashCommandBuilder` variant. */
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  /** Runs the command; awaited by `dispatchInteraction`. */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * A button interaction module as the loader expects it.
 * Registered on the client under `customId`; the loader stores the value as-is
 * as the collection key, so a predicate is stored as the function itself.
 */
export interface Button {
  /**
   * Registry key, or a predicate over the raw interaction id; the dispatcher
   * evaluates predicates against the id received from Discord.
   */
  customId: string | ((id: string) => boolean);
  /** Runs the button action; awaited by `dispatchInteraction`. */
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

/**
 * A gateway event module as the loader expects it.
 * Subscribed through `client.once` when `once` is true, `client.on` otherwise.
 */
export interface Event {
  /** Name of the gateway event to subscribe to (e.g. `ready`). */
  name: string;
  /** When true, the listener is registered one-shot and removed after firing. */
  once?: boolean;
  /** Handles the event; every gateway argument is forwarded as-is. */
  execute: (...args: unknown[]) => Promise<void> | void;
}

/**
 * A select-menu interaction module as the loader expects it.
 * Registered on the client under `customId`; note that the loader also accepts
 * a function `customId` at runtime (keyed by the function name) even though the
 * `Menu` type only declares `string` — see `Loaders.loadMenu`.
 */
export interface Menu {
  /** Registry key used to match the interaction's custom id. */
  customId: string;
  /** Runs the menu action; awaited by `dispatchInteraction`. */
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}

/**
 * A modal submit module as the loader expects it.
 * Unlike the other contracts, `execute` is synchronous (`void`) and the loader
 * keys a function `customId` by its source text — see `Loaders.loadModal`.
 */
export type Modal = {
  /**
   * Registry key, or a predicate over the raw interaction id; the loader keys
   * a predicate by its source text, while the dispatcher evaluates the original
   * predicate stored on the handler.
   */
  customId: string | ((id: string) => boolean);
  /** Runs the modal action; the loader does not call it, the dispatcher awaits it. */
  execute: (interaction: ModalSubmitInteraction) => void;
};
