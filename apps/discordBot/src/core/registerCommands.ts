/**
 * Registers the auto-loaded slash commands with Discord's REST API.
 *
 * Without this step the handlers live only in the in-memory collection on
 * `dsClient`: Discord never offers the commands to users, so no
 * `interactionCreate` event can reach them. Registration replaces the full
 * global command set, which makes it a safe sync of the loaded modules even
 * when commands were removed from the source tree.
 */
import { REST, Routes } from "discord.js";
import { logger } from "shared";
import { ENV } from "../config/env.js";
import { dsClient } from "./client.js";

/**
 * Publishes every loaded slash command to the application's global command set.
 *
 * Missing credentials skip registration with an error log; a rejected REST call
 * is also logged and reported as `false` instead of aborting the login. This
 * keeps a transient Discord outage from taking down a bot that is already
 * configured correctly.
 *
 * @async
 * @returns `true` when Discord accepted the command set, `false` otherwise
 */
export async function registerCommands(): Promise<boolean> {
  const { clientId, token } = ENV;
  if (!clientId || !token) {
    logger.error("Slash command registration skipped: missing credentials");
    return false;
  }

  try {
    const body = [...dsClient.commands.values()].map((command) => command.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(token);

    await rest.put(Routes.applicationCommands(clientId), { body });

    logger.info(`✓ Registered ${body.length} slash commands`);
    return true;
  } catch (err) {
    logger.error(`Slash command registration failed: ${String(err)}`);
    return false;
  }
}
