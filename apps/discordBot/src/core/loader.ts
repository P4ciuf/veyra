import path from "path";
import fs from "fs";
import { dsClient } from "./client.js";
import { logger } from "shared";
import { Button, Command } from "../types/interactions.js";

const client = dsClient;

/**
 * Auto-loads interaction modules from well-known directories under the bot's
 * `src` folder and registers them on the shared Discord client.
 *
 * Each directory (`src/commands`, `src/events`, `src/handlers/{buttons,menus,modals}`)
 * is scanned recursively and every `.ts`/`.js` file is imported as an interaction
 * module. Modules that do not match the expected shape are logged and skipped;
 * they never crash the loader.
 */
export class Loaders {
  /** Number of modules successfully registered per interaction kind. */
  private loadCounts = {
    buttons: 0,
    commands: 0,
    // Reserved for the legacy text-command loader; no loader increments it yet.
    messageCommands: 0,
    events: 0,
    menus: 0,
    modals: 0,
  };

  /**
   * Loads every interaction kind in a fixed order and logs the totals.
   * Missing source directories only produce a warning, so a partially wired
   * bot still boots.
   *
   * @async
   * @returns Resolves when all five categories have been processed.
   * @see loadButton, loadCommand, loadEvent, loadMenu, loadModal
   */
  public async LoadAll(): Promise<void> {
    await this.load("buttons", this.loadButton);
    await this.load("commands", this.loadCommand);
    await this.load("events", this.loadEvent);
    await this.load("menus", this.loadMenu);
    await this.load("modals", this.loadModal);

    logger.info(
      `✓ Total loaded: ${this.loadCounts.buttons} buttons, ${this.loadCounts.commands} commands, ${this.loadCounts.events} events, ${this.loadCounts.menus} menus, ${this.loadCounts.modals} modals`,
    );
  }

  /**
   * Dispatches one interaction category to its dedicated handler.
   * Unknown types resolve to an empty path list and are silently ignored.
   *
   * @param type - One of the keys of the path map in {@link getPaths}.
   * @param handler - Registration callback that returns 1 per loaded module.
   * @returns Resolves after every configured path for `type` has been processed.
   */
  private async load(type: string, handler: (p: string) => Promise<number>): Promise<void> {
    const paths = this.getPaths(type);

    if (paths.length === 0) {
      return;
    }

    for (const p of paths) {
      if (fs.existsSync(p)) {
        await this.processDir(p, handler);
      } else {
        logger.warn(`Path does not exist: ${p}`);
      }
    }
  }

  /**
   * Maps an interaction type to the source directories that hold its modules.
   * Paths are anchored to this file's directory, so they are correct both when
   * running from source (tsx) and from the compiled output (`dist/`).
   *
   * @param type - Interaction kind to locate.
   * @returns Absolute candidate directories; empty when `type` is unknown.
   */
  private getPaths(type: string): string[] {
    const map: Record<string, string[]> = {
      buttons: [path.join(__dirname, "..", "handlers", "buttons")],
      commands: [path.join(__dirname, "..", "commands")],
      events: [path.join(__dirname, "..", "events")],
      menus: [path.join(__dirname, "..", "handlers", "menus")],
      modals: [path.join(__dirname, "..", "handlers", "modals")],
    };
    return map[type] || [];
  }

  /**
   * Walks a directory tree depth-first and hands every module file to `handler`.
   * Files without a `.ts` or `.js` extension are ignored, which keeps stray
   * assets (README files, JSON, etc.) out of the interaction registries.
   *
   * @param dir - Directory to scan; a non-existent directory yields 0.
   * @param handler - Registration callback that returns 1 per loaded module.
   * @returns Total number of modules the handler accepted.
   */
  private async processDir(dir: string, handler: (p: string) => Promise<number>): Promise<number> {
    let count = 0;

    if (!fs.existsSync(dir)) {
      return 0;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const p = path.join(dir, item.name);

      if (item.isDirectory()) {
        count += await this.processDir(p, handler);
      } else if (item.name.match(/\.(ts|js)$/)) {
        count += await handler(p);
      }
    }

    return count;
  }

  /**
   * Dynamically imports a module file and unwraps its default or named export.
   * The result stays untyped because each loader validates the shape it expects.
   *
   * @param filePath - Path to the module file to import
   * @returns The module export, or its `default` export when present
   * @throws Rethrows the import error after logging it
   */
  // Modules are user-provided and only become typed after each loader validates their shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async importModule(filePath: string): Promise<any> {
    const absolutePath = path.resolve(filePath);

    const fileUrl =
      process.platform === "win32"
        ? `file:///${absolutePath.replace(/\\/g, "/")}`
        : `file://${absolutePath}`;

    const urlWithCache = `${fileUrl}?update=${Date.now()}`;

    // The query string busts the module cache of the underlying loader, so a
    // module edited on disk is re-imported on the next LoadAll call without
    // restarting the process. The timestamp also makes each import produce a
    // distinct module instance.
    try {
      const imported = await import(urlWithCache);

      if (imported.default !== undefined) {
        if (typeof imported.default === "object" && imported.default.default !== undefined) {
          return imported.default.default;
        }

        return imported.default;
      }

      if (imported.command) return imported.command;
      if (imported.event) return imported.event;
      if (imported.button) return imported.button;
      if (imported.modal) return imported.modal;
      if (imported.menu) return imported.menu;

      return imported;
    } catch (error) {
      logger.error(`Failed to import module from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Loads one button module and registers it under its `customId` value (used
   * as-is as the collection key). Any import or validation failure is logged
   * and reported as `0`, never thrown.
   *
   * @param p - Absolute path of the module file to load.
   * @returns 1 when the button was registered, 0 when it was skipped or failed.
   */
  private loadButton = async (p: string): Promise<number> => {
    try {
      // Defensive guard: the current scanner only passes button paths, but
      // skip any path that contains "events" so a future shared scanner cannot
      // register an event module in the button collection.
      if (p.includes("events")) return 0;

      const btn = await this.importModule(p);

      if (!btn || !btn.customId || typeof btn.execute !== "function") {
        logger.warn(`Button not loaded from ${p}: missing customId or execute function`);
        return 0;
      }

      const key = btn.customId;
      client.buttons.set(key, btn as Button);
      this.loadCounts.buttons++;
      return 1;
    } catch (err) {
      logger.error(`Error loading button from ${p}:`, { err });
      return 0;
    }
  };

  /**
   * Loads one slash command module and registers it under its `data.name`.
   * The module must provide a builder-like `data` object and a callable `execute`.
   *
   * @param p - Absolute path of the module file to load.
   * @returns 1 when the command was registered, 0 when it was skipped or failed.
   */
  private loadCommand = async (p: string): Promise<number> => {
    try {
      const cmd = await this.importModule(p);

      if (!cmd || !cmd.data || typeof cmd.execute !== "function") {
        logger.warn(`Command not loaded from ${p}: missing data or execute function`);
        return 0;
      }

      client.commands.set(cmd.data.name, cmd as Command);
      this.loadCounts.commands++;
      return 1;
    } catch (err) {
      logger.error(`Error loading command from ${p}:`, err);
      return 0;
    }
  };

  /**
   * Loads one event module and wires its `execute` to the Discord client.
   * A module with `once: true` is subscribed through `client.once`, otherwise
   * through `client.on`; the wrapper forwards all event arguments untouched.
   *
   * @param p - Absolute path of the module file to load.
   * @returns 1 when the event was subscribed, 0 when it was skipped or failed.
   */
  private loadEvent = async (p: string): Promise<number> => {
    try {
      const evt = await this.importModule(p);

      if (!evt || !evt.name || typeof evt.execute !== "function") {
        logger.warn(`Event not loaded from ${p}: missing ${!evt?.name ? "name" : "execute"}`);
        return 0;
      }

      if (evt.once) {
        client.once(evt.name, (...args) => evt.execute(...args));
      } else {
        client.on(evt.name, (...args) => evt.execute(...args));
      }

      this.loadCounts.events++;
      return 1;
    } catch (err) {
      logger.error(`Error loading event from ${p}:`, err);
      return 0;
    }
  };

  /**
   * Loads one select-menu module and registers it under its `customId`.
   * A function `customId` is keyed by the function name (or `"dynamic"` when
   * the function is anonymous), so a menu can declare its registry key itself.
   *
   * @param p - Absolute path of the module file to load.
   * @returns 1 when the menu was registered, 0 when it was skipped or failed.
   */
  private loadMenu = async (p: string): Promise<number> => {
    try {
      const menu = await this.importModule(p);

      if (!menu || !menu.customId || typeof menu.execute !== "function") {
        logger.warn(
          `Menu not loaded from ${p}: missing ${!menu?.customId ? "customId" : "execute"}`,
        );
        return 0;
      }

      const key =
        typeof menu.customId === "function" ? menu.customId.name || "dynamic" : menu.customId;

      client.menus.set(key, menu);
      this.loadCounts.menus++;
      return 1;
    } catch (err) {
      logger.error(`Error loading menu from ${p}:`, err);
      return 0;
    }
  };

  /**
   * Loads one modal module and registers it under its `customId`.
   * Unlike menus, a function `customId` is keyed by its full source text
   * (`toString()`), which makes the registry key deterministic per module.
   *
   * @param p - Absolute path of the module file to load.
   * @returns 1 when the modal was registered, 0 when it was skipped or failed.
   */
  private loadModal = async (p: string): Promise<number> => {
    try {
      const modal = await this.importModule(p);

      if (!modal || !modal.customId || typeof modal.execute !== "function") {
        logger.warn(
          `Modal not loaded from ${p}: missing ${!modal?.customId ? "customId" : "execute"}`,
        );
        return 0;
      }

      const key = typeof modal.customId === "function" ? modal.customId.toString() : modal.customId;

      client.modals.set(key, modal);
      this.loadCounts.modals++;
      return 1;
    } catch (err) {
      logger.error(`Error loading modal from ${p}:`, err);
      return 0;
    }
  };
}
