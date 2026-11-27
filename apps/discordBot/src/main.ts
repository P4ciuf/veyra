/**
 * Bot entrypoint.
 *
 * Boot sequence: validate credentials from `ENV`, auto-load interaction modules
 * with {@link Loaders}, publish their slash commands through {@link registerCommands},
 * then log in to Discord. The auto-loaded `interactionCreate` event routes incoming
 * interactions to those handlers. SIGINT/SIGTERM handlers intercept the default
 * termination and disconnect cleanly via {@link shutdown}.
 */
import { Loaders } from "./core/loader";
import { registerCommands } from "./core/registerCommands";
import { dsClient } from "./core/client";
import { ENV } from "./config/env";
import { logger } from "shared";
import { shutdown } from "./core/shutdown";

if (!ENV.clientId || !ENV.token) {
  // Missing credentials are fatal: log once, start tearing down the client and
  // exit immediately with a non-zero status so the supervisor can report it.
  // The shutdown promise is not awaited: process.exit() runs before it settles.
  logger.error("Client ID or Token not found");
  (async () => await shutdown())();
  process.exit(1);
}

/** Boots the bot: module loading, command registration, then Discord login. */
(async () => {
  try {
    await new Loaders().LoadAll();
    await registerCommands();

    await dsClient.login(ENV.token);
    logger.info("Client logged in as: " + dsClient.user?.username);
  } catch (err) {
    // Initialization failures (e.g. login rejected because a privileged intent
    // is disabled in the developer portal) are logged instead of rethrown so
    // the process survives long enough for the signal handlers to run.
    logger.error("Bot initialization error: " + err);
  }
})();

// Graceful stop for Ctrl-C (SIGINT) and container stops (SIGTERM).
/** Handles Ctrl-C: logs the signal and destroys the Discord client. */
process.on("SIGINT", async () => {
  logger.info("SIGINT");
  await shutdown();
});

/**
 * Handles container stops: logs the signal, destroys the Discord client and
 * sets `process.exitCode` to 1 for the eventual exit.
 */
process.on("SIGTERM", async () => {
  logger.info("SIGTERM");
  await shutdown();
  process.exitCode = 1;
});
