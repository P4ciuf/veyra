/**
 * Tests for `schemas/bot-metadata.schema.json`, the official Draft 2020-12
 * contract for the `veyra.json` submission manifest.
 *
 * The schema is the only executable description of the submission format (no
 * application code consumes it yet), so the suite compiles it with Ajv and
 * exercises the constraints that a future validator must enforce. Ajv 2020 is
 * used because the schema declares `$schema` Draft 2020-12, and
 * `ajv-formats` supplies the `uri` format used by `repository`. The documented
 * semantic checks that JSON Schema cannot express (duplicate variable names,
 * SPDX list membership, credential scanning) are intentionally out of scope.
 */
import * as Ajv2020Module from "ajv/dist/2020.js";
import * as addFormatsModule from "ajv-formats";
import { describe, expect, it } from "vitest";
import schema from "../../schemas/bot-metadata.schema.json" with { type: "json" };

// Both packages are CommonJS: under `module: nodenext` TypeScript exposes their
// exports as a namespace instead of the default export, while Vite resolves
// `.default` to the callable/constructable value at runtime. The minimal local
// types below keep the suite independent of Ajv's declaration-file interop.
/** Minimal Ajv 2020 instance surface used by this suite. */
interface Ajv2020Instance {
  compile: (schema: object) => (data: unknown) => boolean;
}

/** Constructor signature of the Ajv 2020 default export. */
interface Ajv2020Constructor {
  new (options?: Record<string, unknown>): Ajv2020Instance;
}

/** Ajv 2020 default export, normalized from the CommonJS namespace. */
const Ajv2020 = (Ajv2020Module as unknown as { default: Ajv2020Constructor }).default;
/** `ajv-formats` default export, normalized from the CommonJS namespace. */
const addFormats = (addFormatsModule as unknown as { default: (ajv: Ajv2020Instance) => void })
  .default;

/** Ajv instance that collects every validation error instead of stopping at the first. */
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

/** Compiled validator for the bot metadata schema. */
const validate = ajv.compile(schema);

/**
 * Minimal manifest satisfying every required top-level field.
 * Tests clone this object so overrides never leak between cases.
 */
const baseManifest: Record<string, unknown> = {
  schemaVersion: "1.0",
  name: "Example Bot",
  description: "A small example bot used in the documentation.",
  category: "utility",
  version: "1.0.0",
  license: "MIT",
  repository: "https://github.com/example-org/example-bot",
  runtime: {
    language: "typescript",
    version: "24.0.0",
  },
  variables: [],
};

/**
 * Builds a manifest from the base object plus per-test overrides.
 *
 * @param overrides - Top-level fields to replace or add.
 * @returns A deep clone of the base manifest with the overrides applied.
 */
const manifestWith = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...structuredClone(baseManifest),
  ...overrides,
});

/**
 * Builds a variable entry with valid defaults for the fields a test does not
 * override.
 *
 * @param overrides - Variable fields to replace or add.
 * @returns A variable object accepted by the schema unless the override breaks a rule.
 */
const variableWith = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  name: "LOG_LEVEL",
  description: "Logging verbosity.",
  required: false,
  secret: false,
  ...overrides,
});

describe("bot-metadata schema", () => {
  it("accepts the example embedded in the schema", () => {
    expect(validate(schema.examples?.[0])).toBe(true);
  });

  it("accepts an optional non-secret variable with a default", () => {
    const manifest = manifestWith({ variables: [variableWith({ default: "info" })] });

    expect(validate(manifest)).toBe(true);
  });

  it("rejects a manifest missing a required top-level field", () => {
    const { variables: _variables, ...withoutVariables } = manifestWith();

    expect(validate(withoutVariables)).toBe(false);
  });

  it("rejects unknown top-level properties", () => {
    const manifest = manifestWith({ unexpected: true });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects a category outside the controlled list", () => {
    const manifest = manifestWith({ category: "gaming" });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects a version that is not semantic versioning", () => {
    const manifest = manifestWith({ version: "1.0" });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects a repository URL that is not HTTPS", () => {
    const manifest = manifestWith({ repository: "http://github.com/example-org/example-bot" });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects a required variable that defines a default", () => {
    const manifest = manifestWith({
      variables: [variableWith({ required: true, default: "info" })],
    });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects a secret variable that defines a default", () => {
    const manifest = manifestWith({
      variables: [variableWith({ secret: true, default: "secret-value" })],
    });

    expect(validate(manifest)).toBe(false);
  });

  it("rejects an environment variable name that is not uppercase", () => {
    const manifest = manifestWith({ variables: [variableWith({ name: "log_level" })] });

    expect(validate(manifest)).toBe(false);
  });
});
