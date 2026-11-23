import dotenv from "dotenv";

// dotenv loads the plain `.env` file from the process cwd at import time; when
// the bot is started through `pnpm --filter discord-bot` that cwd is
// `apps/discordBot`. Variants such as `.env.local` are never read.
dotenv.config();

/**
 * Bot configuration resolved once at import time from the process environment.
 *
 * Values are snapshotted when this module is first imported: later changes to
 * `process.env` have no effect on this object.
 */
export const ENV = {
  /** Discord bot token, required to log in; `main.ts` exits when it is missing. */
  token: process.env.DISCORD_TOKEN,
  /** Discord application (client) ID, required; `main.ts` exits when it is missing. */
  clientId: process.env.DISCORD_CLIENT_ID,
  /** Runtime environment name; falls back to `production` when unset or empty. */
  nodeEnv: process.env.NODE_ENV || "production",
};
