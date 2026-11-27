/**
 * Tests for `shared/src/utils/logger.ts`.
 *
 * The module captures its configuration (log directory and level) at import
 * time from `process.cwd()` and `NODE_ENV`, so each test re-imports the module
 * fresh with `vi.resetModules()` after arranging the environment.
 *
 * Console output is asserted through spies on the streams winston can write
 * to: `process.stdout.write`, `process.stderr.write`, and `console._stdout`
 * (Node's console uses its own stream object, which is what the winston
 * console transport targets). File output is asserted against the real
 * rotating `app-<date>.log` file, polled with a deadline because winston
 * writes are async.
 *
 * The Vitest worker runs as its own forked process, so the cwd change stays
 * local to this file. The throwaway log directory is intentionally not
 * deleted: winston keeps lazy file streams open that may reopen after the
 * deletion, producing spurious unhandled ENOENT errors. Messages are unique
 * per test so a shared directory cannot cause cross-test false positives.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

/**
 * Re-imports the logger module through the suite's specifier.
 * Every call must resolve the same literal path: variable specifiers bypass the
 * Vite resolver and cannot map the `.js` extension onto the `.ts` source.
 *
 * @returns The freshly evaluated module (after `vi.resetModules()`).
 */
const importLogger = (): Promise<typeof import("../../shared/src/utils/logger.js")> =>
  import("../../shared/src/utils/logger.js");

/** Node's console may carry a private stream object, distinct from process.stdout. */
interface ConsoleWithStdout {
  _stdout?: NodeJS.WriteStream;
}

/**
 * Polls `predicate` until it is true or the deadline expires.
 *
 * @param predicate - Condition to check on each poll.
 * @param timeoutMs - Maximum wait in milliseconds.
 * @returns `true` when the predicate became true before the deadline.
 */
const waitFor = async (predicate: () => boolean, timeoutMs = 3000): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return predicate();
};

/**
 * Local calendar date, matching the file transport's `YYYY-MM-DD` date pattern.
 *
 * @returns The current date formatted as `YYYY-MM-DD` in local time.
 */
const localDateStamp = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

// Captured before the suite changes into the throwaway log directory.
const repoCwd = process.cwd();
const stdoutLines: string[] = [];
const stderrLines: string[] = [];

let tmpDir = "";
let stdoutSpy: MockInstance;
let stderrSpy: MockInstance;
let consoleStdoutSpy: MockInstance | undefined;

/**
 * Builds a `write` implementation that collects chunks into `sink`.
 *
 * @param sink - Array that receives the decoded output chunks.
 * @returns A `write`-compatible function that always reports success.
 */
const capture =
  (sink: string[]) =>
  (chunk: string | Uint8Array): boolean => {
    sink.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  };

/** Full console output produced so far in the current test. */
const output = (): string => stdoutLines.join("") + stderrLines.join("");

/** Rotating app log file inside the throwaway cwd. */
const appLogFile = (): string => path.join(tmpDir, "logs", `app-${localDateStamp()}.log`);

/**
 * Reads a log file, or an empty string while it does not exist yet.
 *
 * @param file - Absolute path of the log file.
 * @returns The file contents, or `""` when the file is still absent.
 */
const readFileSafe = (file: string): string =>
  fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "veyra-logger-"));
});

describe("logger", () => {
  beforeEach(() => {
    process.chdir(tmpDir);
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    stdoutLines.length = 0;
    stderrLines.length = 0;
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(capture(stdoutLines) as unknown as typeof process.stdout.write);
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(capture(stderrLines) as unknown as typeof process.stderr.write);
    const consoleRef = console as unknown as ConsoleWithStdout;
    if (consoleRef._stdout) {
      consoleStdoutSpy = vi
        .spyOn(consoleRef._stdout, "write")
        .mockImplementation(capture(stdoutLines) as unknown as NodeJS.WriteStream["write"]);
    }
  });

  afterEach(() => {
    process.chdir(repoCwd);
    vi.unstubAllEnvs();
    vi.resetModules();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    consoleStdoutSpy?.mockRestore();
    consoleStdoutSpy = undefined;
  });

  it("creates the logs directory relative to the process cwd on import", async () => {
    await importLogger();

    expect(fs.existsSync(path.join(tmpDir, "logs"))).toBe(true);
  });

  it("writes info lines to stdout with colour, timestamp, level and message", async () => {
    const { logger } = await importLogger();

    logger.info("hello info");

    const seen = await waitFor(() => output().includes("[INFO] hello info"));
    expect(seen).toBe(true);
    expect(output()).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO\] hello info/);
    expect(output()).toContain("\x1b[36m[");
    expect(output()).toContain("\x1b[0m");
  });

  it("appends JSON-stringified metadata next to the message", async () => {
    const { logger } = await importLogger();

    logger.info("with meta", { extra: 1 });

    const seen = await waitFor(() => output().includes('[INFO] with meta {"extra":1}'));
    expect(seen).toBe(true);
  });

  it("suppresses debug output when NODE_ENV is production", async () => {
    const { logger } = await importLogger();

    // Prove the console pipeline is live before asserting the negative case.
    logger.info("prod marker");
    logger.debug("hidden debug");

    const seen = await waitFor(() => output().includes("prod marker"));
    expect(seen).toBe(true);
    expect(output()).not.toContain("hidden debug");
  });

  it("emits debug output when NODE_ENV is development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { logger } = await importLogger();

    logger.debug("visible debug");

    const seen = await waitFor(() => output().includes("[DEBUG] visible debug"));
    expect(seen).toBe(true);
  });

  it("routes error messages to the rotating app log file with metadata", async () => {
    const { logger } = await importLogger();

    logger.error("boom file", { code: 42 });

    const appLog = appLogFile();
    const seen = await waitFor(() =>
      readFileSafe(appLog).includes('[ERROR] boom file {"code":42}'),
    );
    expect(seen).toBe(true);
  });

  it("routes warn and error messages to the app file and filters lower levels out", async () => {
    const { logger } = await importLogger();

    logger.warn("just warn");
    logger.info("not a warn");
    logger.error("an error");

    const appLog = appLogFile();

    const seenWarn = await waitFor(() => readFileSafe(appLog).includes("[WARN] just warn"));
    expect(seenWarn).toBe(true);

    const seenError = await waitFor(() => readFileSafe(appLog).includes("[ERROR] an error"));
    expect(seenError).toBe(true);

    expect(readFileSafe(appLog)).not.toContain("not a warn");
  });
});
