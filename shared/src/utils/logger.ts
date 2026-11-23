import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

// Logs live under `<process cwd>/logs`: starting the bot from a different
// directory changes where log files are written. The directory is created
// eagerly so the rotating file transport never fails on a missing path.
const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/** ANSI escape codes used by the console formatter, keyed by winston level. */
const COLOURS = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  debug: "\x1b[35m",
  reset: "\x1b[0m",
};

/** Timestamp formatter shared by the console and file transports. */
const timestamp = winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" });

/**
 * Console formatter: colours the whole line by severity and appends any extra
 * metadata (everything except `level`, `message` and `timestamp`) as JSON.
 *
 * @param info - Log record shaped by winston.
 * @returns A single formatted console line terminated by the caller.
 */
const colouredConsole = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const colour = COLOURS[level as keyof typeof COLOURS] ?? "";
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${colour}[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}${COLOURS.reset}`;
});

/**
 * File formatter: same layout as {@link colouredConsole} without the ANSI
 * colour escapes, so log files stay greppable.
 *
 * @param info - Log record shaped by winston.
 * @returns A single formatted line terminated by the caller.
 */
const plainFile = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
});

// Captured once at import: toggling NODE_ENV later in the process lifetime
// has no effect on the configured levels.
const isDevelopment = process.env.NODE_ENV === "development";

/** Options for the rotating file transport: daily files, 7-day retention, plain format. */
const rotateOptions = {
  datePattern: "YYYY-MM-DD",
  maxFiles: "7d",
  zippedArchive: false,
  format: winston.format.combine(timestamp, plainFile),
};

/** Winston transports: colourised console plus the rotating warn/error file. */
const transports: winston.transport[] = [
  new winston.transports.Console({
    level: isDevelopment ? "debug" : "info",
    format: winston.format.combine(timestamp, colouredConsole),
  }),

  // Single file: receives "warn" and "error" (error has higher priority, so
  // the "warn" threshold includes it). The level is printed by `plainFile`,
  // so the two are still distinguishable inside the file.
  new DailyRotateFile({
    ...rotateOptions,
    level: "warn",
    filename: path.join(logsDir, "app-%DATE%.log"),
    format: winston.format.combine(timestamp, plainFile),
  }),
];

/** The single winston instance behind the exported `logger` facade. */
const log = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  transports,
  exitOnError: false,
});

/**
 * Optional structured metadata forwarded to winston.
 * `unknown` keeps callers free to log arbitrary values, including caught errors.
 */
type Meta = unknown;

/**
 * Project-wide logging facade over winston.
 *
 * One console transport and one rotating file transport are configured at
 * import time: the console (level depends on `NODE_ENV`) and
 * `logs/app-<date>.log`, which receives warn and error records with 7-day
 * retention. Only `debug` is gated at call time, and only against the
 * environment captured at import.
 */
export const logger = {
  /**
   * Logs at error level; mirrored into the rotating app file.
   *
   * @param message - Human-readable description of the failure.
   * @param meta - Optional structured metadata rendered as JSON next to the message.
   */
  error(message: string, meta?: Meta): void {
    log.error(message, meta);
  },

  /**
   * Logs at warn level; mirrored into the rotating app file, which accepts
   * warn and error records.
   *
   * @param message - Human-readable description of the anomaly.
   * @param meta - Optional structured metadata rendered as JSON next to the message.
   */
  warn(message: string, meta?: Meta): void {
    log.warn(message, meta);
  },

  /**
   * Logs at info level; shown on the console in every environment.
   *
   * @param message - Progress or lifecycle message.
   * @param meta - Optional structured metadata rendered as JSON next to the message.
   */
  info(message: string, meta?: Meta): void {
    log.info(message, meta);
  },

  /**
   * Logs at debug level, but only when the module was imported with
   * `NODE_ENV=development`; in every other environment the call is a no-op.
   *
   * @param message - Diagnostic message.
   * @param meta - Optional structured metadata rendered as JSON next to the message.
   */
  debug(message: string, meta?: Meta): void {
    if (isDevelopment) {
      log.debug(message, meta);
    }
  },
};
