/**
 * Tests for `apps/discordBot/src/core/client.ts`.
 * The module builds a real (offline) Discord client; no login is attempted.
 * `discord.js` is resolved through the alias declared in `vitest.config.js`,
 * because the workspace links it only inside `apps/discordBot/node_modules`.
 */
import { describe, expect, it } from "vitest";
import { Client, Collection, GatewayIntentBits, IntentsBitField } from "discord.js";
import { dsClient } from "../../../../apps/discordBot/src/core/client.js";

describe("dsClient", () => {
  it("is a discord.js Client instance", () => {
    expect(dsClient).toBeInstanceOf(Client);
  });

  it("enables the five required gateway intents", () => {
    // discord.js v14 keeps the parsed bitfield in client.options, not client.intents.
    const intents = dsClient.options.intents as IntentsBitField;
    const requiredIntents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
    ];

    for (const intent of requiredIntents) {
      expect(intents.has(intent)).toBe(true);
    }
  });

  it("exposes the four interaction collections, initially empty", () => {
    expect(dsClient.commands).toBeInstanceOf(Collection);
    expect(dsClient.buttons).toBeInstanceOf(Collection);
    expect(dsClient.modals).toBeInstanceOf(Collection);
    expect(dsClient.menus).toBeInstanceOf(Collection);

    expect(dsClient.commands.size).toBe(0);
    expect(dsClient.buttons.size).toBe(0);
    expect(dsClient.modals.size).toBe(0);
    expect(dsClient.menus.size).toBe(0);
  });
});
