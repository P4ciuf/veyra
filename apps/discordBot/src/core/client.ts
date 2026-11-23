import { Button, Command, Menu, Modal } from "../types/interactions";
import { Client, Collection, GatewayIntentBits } from "discord.js";

/**
 * Discord.js client extended with the collections that hold the interaction
 * handlers auto-loaded by `src/core/loader.ts` at startup.
 */
interface ExtendedClient extends Client {
  /** Slash command handlers, keyed by the command's `data.name`. */
  commands: Collection<string, Command>;
  /** Button handlers, keyed by `customId`. */
  buttons: Collection<string, Button>;
  /** Modal submit handlers, keyed by `customId`. */
  modals: Collection<string, Modal>;
  /** Select menu handlers, keyed by `customId`. */
  menus: Collection<string, Menu>;
}

/**
 * Shared Discord client singleton: `loader.ts` registers interaction handlers
 * into its collections, `shutdown.ts` destroys it and `main.ts` logs it in.
 *
 * Note: `MessageContent` and `GuildMembers` are privileged intents and must be
 * enabled in the Discord developer portal, otherwise the login fails.
 */
export const dsClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
}) as ExtendedClient;

// The interaction collections are attached to the singleton so that any module
// importing `dsClient` sees the same handler registries.
dsClient.buttons = new Collection<string, Button>();
dsClient.commands = new Collection<string, Command>();
dsClient.modals = new Collection<string, Modal>();
dsClient.menus = new Collection<string, Menu>();
