/**
 * Tests for `apps/discordBot/src/core/loader.ts`.
 *
 * The loader reads real files from disk and imports them through cache-busted
 * `file://` URLs, so the positive paths run against committed fixture modules
 * under `fixtures/`. Only the shared logger is mocked: winston writes rotating
 * files to disk, which is a real I/O side effect, while the Discord client is
 * exercised for real because no network connection is involved.
 */
import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("shared", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { dsClient } from "../../../../apps/discordBot/src/core/client.js";
import { Loaders } from "../../../../apps/discordBot/src/core/loader.js";
import { logger } from "shared";

/** Signature shared by every private loader handler in `Loaders`. */
type LoadHandler = (p: string) => Promise<number>;

/** Load counters of `Loaders`, exposed here only to assert registered totals. */
interface LoadCounts {
  buttons: number;
  commands: number;
  events: number;
  menus: number;
  modals: number;
}

/**
 * Narrowed view of the private API of `Loaders`.
 * The handlers are the actual units of behavior (they register into the client
 * collections), so they are exercised through this typed projection instead of
 * duplicating the loader tree inside `src/`.
 */
interface LoaderInternals {
  readonly loadCounts: LoadCounts;
  load(type: string, handler: LoadHandler): Promise<void>;
  processDir(dir: string, handler: LoadHandler): Promise<number>;
  loadButton(p: string): Promise<number>;
  loadCommand(p: string): Promise<number>;
  loadEvent(p: string): Promise<number>;
  loadMenu(p: string): Promise<number>;
  loadModal(p: string): Promise<number>;
}

/** Shape of the `globalThis` slots used by the event fixtures to record calls. */
type Recorder = Record<string, unknown[][] | undefined>;

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(here, "fixtures");
const COMMANDS_DIR = path.join(FIXTURES, "commands");
const BUTTONS_DIR = path.join(FIXTURES, "buttons");
const EVENTS_DIR = path.join(FIXTURES, "events");
const MENUS_DIR = path.join(FIXTURES, "menus");
const MODALS_DIR = path.join(FIXTURES, "modals");
const SCANNER_DIR = path.join(FIXTURES, "scanner");

/** Reads a `globalThis` call-recording slot owned by the event fixtures. */
const recorded = (key: "__veyraEventOn" | "__veyraEventOnce"): unknown[][] =>
  (globalThis as unknown as Recorder)[key] ?? [];

describe("Loaders", () => {
  let loader: Loaders;
  let internals: LoaderInternals;

  beforeEach(() => {
    loader = new Loaders();
    internals = loader as unknown as LoaderInternals;
    dsClient.buttons.clear();
    dsClient.commands.clear();
    dsClient.modals.clear();
    dsClient.menus.clear();
    (globalThis as unknown as Recorder).__veyraEventOn = [];
    (globalThis as unknown as Recorder).__veyraEventOnce = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadCommand", () => {
    it("registers a valid default-export command under its command name", async () => {
      const result = await internals.loadCommand(path.join(COMMANDS_DIR, "validCommand.ts"));

      expect(result).toBe(1);
      expect(dsClient.commands.get("ping")).toBeDefined();
      expect(internals.loadCounts.commands).toBe(1);
    });

    it("unwraps a named `command` export when there is no default export", async () => {
      const result = await internals.loadCommand(path.join(COMMANDS_DIR, "namedCommand.ts"));

      expect(result).toBe(1);
      expect(dsClient.commands.get("named")).toBeDefined();
    });

    it("unwraps a nested `default.default` export", async () => {
      const result = await internals.loadCommand(path.join(COMMANDS_DIR, "doubleDefault.ts"));

      expect(result).toBe(1);
      expect(dsClient.commands.get("inner")).toBeDefined();
    });

    it("rejects a module without `data` or `execute` and warns", async () => {
      const result = await internals.loadCommand(path.join(COMMANDS_DIR, "invalidCommand.ts"));

      expect(result).toBe(0);
      expect(dsClient.commands.size).toBe(0);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("missing data or execute"),
      );
    });

    it("rejects a module without any recognized export and warns", async () => {
      const result = await internals.loadCommand(path.join(COMMANDS_DIR, "noExports.ts"));

      expect(result).toBe(0);
      expect(dsClient.commands.size).toBe(0);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
    });

    it("reports a failed import through the error log without throwing", async () => {
      const missing = path.join(COMMANDS_DIR, "missing-module.ts");

      const result = await internals.loadCommand(missing);

      expect(result).toBe(0);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining("missing-module.ts"),
        expect.anything(),
      );
    });
  });

  describe("loadButton", () => {
    it("registers a valid button under its customId", async () => {
      const result = await internals.loadButton(path.join(BUTTONS_DIR, "validButton.ts"));

      expect(result).toBe(1);
      expect(dsClient.buttons.get("btn-1")).toBeDefined();
      expect(internals.loadCounts.buttons).toBe(1);
    });

    it("rejects a button with an empty customId and warns", async () => {
      const result = await internals.loadButton(path.join(BUTTONS_DIR, "invalidButton.ts"));

      expect(result).toBe(0);
      expect(dsClient.buttons.size).toBe(0);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("missing customId or execute"),
      );
    });

    it("short-circuits on paths containing 'events' without importing the module", async () => {
      const result = await internals.loadButton(path.join(EVENTS_DIR, "validEvent.ts"));

      expect(result).toBe(0);
      expect(dsClient.buttons.size).toBe(0);
      // The event fixture would trigger the "missing customId" warning if it
      // were imported, so a silent 0 proves the path check skipped the import.
      expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
    });

    it("reports a failed import through the error log without throwing", async () => {
      const missing = path.join(BUTTONS_DIR, "missing-module.ts");

      const result = await internals.loadButton(missing);

      expect(result).toBe(0);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining("missing-module.ts"),
        expect.anything(),
      );
    });
  });

  describe("loadEvent", () => {
    it("subscribes a recurring event through client.on and forwards arguments", async () => {
      const onSpy = vi.spyOn(dsClient, "on");

      const result = await internals.loadEvent(path.join(EVENTS_DIR, "validEvent.ts"));

      expect(result).toBe(1);
      expect(onSpy).toHaveBeenCalledWith("ready", expect.any(Function));

      const handler = onSpy.mock.calls[0]?.[1];
      handler?.("arg-1", "arg-2");

      expect(recorded("__veyraEventOn")).toEqual([["arg-1", "arg-2"]]);
      expect(internals.loadCounts.events).toBe(1);
    });

    it("subscribes a one-shot event through client.once", async () => {
      // Note: EventEmitter.once delegates to `on` internally, so the `on` spy
      // is not asserted here; the wiring contract is what `once` receives.
      const onceSpy = vi.spyOn(dsClient, "once");

      const result = await internals.loadEvent(path.join(EVENTS_DIR, "onceEvent.ts"));

      expect(result).toBe(1);
      expect(onceSpy).toHaveBeenCalledWith("custom-once", expect.any(Function));

      onceSpy.mock.calls[0]?.[1]?.("payload");
      expect(recorded("__veyraEventOnce")).toEqual([["payload"]]);
    });

    it("rejects an event without execute and warns", async () => {
      const onSpy = vi.spyOn(dsClient, "on");
      const onceSpy = vi.spyOn(dsClient, "once");

      const result = await internals.loadEvent(path.join(EVENTS_DIR, "invalidEvent.ts"));

      expect(result).toBe(0);
      expect(onSpy).not.toHaveBeenCalled();
      expect(onceSpy).not.toHaveBeenCalled();
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("missing execute"),
      );
    });

    it("reports a failed import through the error log without throwing", async () => {
      const missing = path.join(EVENTS_DIR, "missing-module.ts");

      const result = await internals.loadEvent(missing);

      expect(result).toBe(0);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining("missing-module.ts"),
        expect.anything(),
      );
    });
  });

  describe("loadMenu", () => {
    it("registers a static menu under its customId", async () => {
      const result = await internals.loadMenu(path.join(MENUS_DIR, "validMenu.ts"));

      expect(result).toBe(1);
      expect(dsClient.menus.get("menu-1")).toBeDefined();
    });

    it("keys a function customId by the function name", async () => {
      const result = await internals.loadMenu(path.join(MENUS_DIR, "dynamicMenu.ts"));

      expect(result).toBe(1);
      expect(dsClient.menus.get("pickMenu")).toBeDefined();
    });

    it("falls back to the 'dynamic' key for anonymous function customIds", async () => {
      const result = await internals.loadMenu(path.join(MENUS_DIR, "anonymousMenu.ts"));

      expect(result).toBe(1);
      expect(dsClient.menus.get("dynamic")).toBeDefined();
    });

    it("rejects a menu whose execute is not a function and warns", async () => {
      const result = await internals.loadMenu(path.join(MENUS_DIR, "invalidMenu.ts"));

      expect(result).toBe(0);
      expect(dsClient.menus.size).toBe(0);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("missing execute"),
      );
    });

    it("reports a failed import through the error log without throwing", async () => {
      const missing = path.join(MENUS_DIR, "missing-module.ts");

      const result = await internals.loadMenu(missing);

      expect(result).toBe(0);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining("missing-module.ts"),
        expect.anything(),
      );
    });
  });

  describe("loadModal", () => {
    it("registers a static modal under its customId", async () => {
      const result = await internals.loadModal(path.join(MODALS_DIR, "validModal.ts"));

      expect(result).toBe(1);
      expect(dsClient.modals.get("modal-1")).toBeDefined();
    });

    it("keys a function customId by its source text", async () => {
      const result = await internals.loadModal(path.join(MODALS_DIR, "dynamicModal.ts"));

      expect(result).toBe(1);
      const keys = [...dsClient.modals.keys()];
      expect(keys).toHaveLength(1);
      expect(keys[0]).toContain("checkModal");
    });

    it("rejects a modal whose execute is not a function and warns", async () => {
      const result = await internals.loadModal(path.join(MODALS_DIR, "invalidModal.ts"));

      expect(result).toBe(0);
      expect(dsClient.modals.size).toBe(0);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("missing execute"),
      );
    });

    it("reports a failed import through the error log without throwing", async () => {
      const missing = path.join(MODALS_DIR, "missing-module.ts");

      const result = await internals.loadModal(missing);

      expect(result).toBe(0);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.stringContaining("missing-module.ts"),
        expect.anything(),
      );
    });
  });

  describe("processDir", () => {
    it("recursively counts every .ts/.js module, including nested directories", async () => {
      const handler = vi.fn<LoadHandler>(async () => 1);

      const count = await internals.processDir(COMMANDS_DIR, handler);

      // 5 files at the top level + 1 inside nested/.
      expect(count).toBe(6);
      expect(handler).toHaveBeenCalledTimes(6);
      expect(handler).toHaveBeenCalledWith(path.join(COMMANDS_DIR, "nested", "deepCommand.ts"));
    });

    it("ignores files that are not .ts or .js", async () => {
      const handler = vi.fn<LoadHandler>(async () => 1);

      const count = await internals.processDir(SCANNER_DIR, handler);

      expect(count).toBe(1);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(path.join(SCANNER_DIR, "only.ts"));
    });

    it("returns 0 for a directory that does not exist", async () => {
      const handler = vi.fn<LoadHandler>(async () => 1);

      const count = await internals.processDir(path.join(FIXTURES, "does-not-exist"), handler);

      expect(count).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("load", () => {
    it("skips the handler and warns once for a known type whose directory is missing", async () => {
      const handler = vi.fn<LoadHandler>(async () => 1);

      await internals.load("commands", handler);

      expect(handler).not.toHaveBeenCalled();
      expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("Path does not exist"),
      );
    });

    it("silently ignores unknown types (empty path mapping)", async () => {
      const handler = vi.fn<LoadHandler>(async () => 1);

      await internals.load("unknown-type", handler);

      expect(handler).not.toHaveBeenCalled();
      expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
    });
  });

  describe("LoadAll", () => {
    it("warns for every missing source directory and logs a zero summary", async () => {
      await loader.LoadAll();

      expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(5);
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.stringContaining("Path does not exist"),
      );
      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        "✓ Total loaded: 0 buttons, 0 commands, 0 events, 0 menus, 0 modals",
      );
    });
  });
});
