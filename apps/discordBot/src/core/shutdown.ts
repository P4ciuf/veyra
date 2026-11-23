import { logger } from "shared";
import { dsClient } from "./client";

/**
 * Gracefully disconnects the shared Discord client.
 *
 * Called by `main.ts` for missing credentials and on SIGINT/SIGTERM. Boot
 * initialization errors are logged by `main.ts` without calling shutdown.
 *
 * @async
 * @returns Resolves once the client is destroyed. Never rejects: a destroy
 * failure is logged through the shared logger instead of being rethrown.
 */
export async function shutdown() {
  try {
    await dsClient.destroy();
    logger.info("Client successfully destroyed");
  } catch (err) {
    logger.error("Bot shutdown error: " + err);
  }
}
