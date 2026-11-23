/**
 * Entry point of the `shared` workspace package.
 * Re-exports the cross-package utilities; currently only the winston-backed
 * logger, consumed by the bot as `import { logger } from "shared"`.
 */
export { logger } from "./utils/logger";
