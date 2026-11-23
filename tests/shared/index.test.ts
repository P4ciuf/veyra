/**
 * Tests for `shared/src/index.ts`, the public entry point of the `shared`
 * workspace package.
 *
 * The suite resolves the `shared` specifier through the alias declared in
 * `vitest.config.js`, which points at this exact barrel file — so the import
 * below exercises the module that bot code loads with
 * `import { logger } from "shared"`, not an assumed copy of it. The re-export
 * contract is asserted by identity against a direct import of the underlying
 * utility module: both specifiers must resolve to the same singleton.
 *
 * Importing the real logger module has one observable side effect (it creates
 * the `logs/` directory under the process cwd, which is gitignored); no log
 * record is written because no logging call is made here.
 */
import { describe, expect, it } from "vitest";
import { logger } from "shared";
import { logger as loggerFromUtils } from "../../shared/src/utils/logger.js";

describe("shared entry point", () => {
  it("re-exports the winston-backed logger singleton from utils/logger", () => {
    expect(logger).toBe(loggerFromUtils);
  });

  it("exposes the four log levels as callable facade methods", () => {
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });
});
