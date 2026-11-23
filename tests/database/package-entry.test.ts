/**
 * Contract tests for the publishable entry points of the workspace packages.
 *
 * These are configuration regressions rather than runtime behavior: the
 * `database` package once declared `dist/index.js` while its `build` script
 * compiled `prisma.config.ts` into the output, emitting `dist/src/index.js`
 * instead. Both lifecycle `prepare` scripts also invoked `pnpm i` recursively.
 * Reading the manifests directly keeps those mistakes from being reintroduced
 * without requiring a build before the test suite runs.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Shape of the subset of `package.json` read by these tests. */
interface PackageManifest {
  /** Module specifier used by CommonJS consumers. */
  main?: string;
  /** Declaration file used by TypeScript consumers. */
  types?: string;
  /** Conditional export map. */
  exports?: Record<string, unknown>;
  /** Files included in a packed tarball. */
  files?: string[];
  /** npm lifecycle and user scripts. */
  scripts?: Record<string, string>;
}

/** Shape of the compiler options relevant to the emitted layout. */
interface BuildTsconfig {
  /** Compiler options inherited from the base config and overridden here. */
  compilerOptions: { rootDir?: string; outDir?: string; incremental?: boolean };
  /** Source globs compiled by the build. */
  include: string[];
}

/**
 * Reads and parses a UTF-8 JSON file relative to this test file.
 *
 * @param relativePath - Path from `tests/database/` to the JSON file.
 * @returns The parsed JSON document.
 */
function readJson<T>(relativePath: string): T {
  const absolutePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

/** `database/package.json`, read fresh for every assertion. */
const readDatabaseManifest = (): PackageManifest =>
  readJson<PackageManifest>("../../database/package.json");

/** `shared/package.json`, read fresh for every assertion. */
const readSharedManifest = (): PackageManifest =>
  readJson<PackageManifest>("../../shared/package.json");

describe("database package entry point", () => {
  it("builds with tsconfig.build.json, which emits a flat dist from src only", () => {
    const manifest = readDatabaseManifest();
    const tsconfig = readJson<BuildTsconfig>("../../database/tsconfig.build.json");
    const baseConfig = readJson<BuildTsconfig>("../../database/tsconfig.json");

    expect(manifest.scripts?.build).toContain("tsconfig.build.json");
    expect(tsconfig.compilerOptions.rootDir).toBe("src");
    expect(tsconfig.compilerOptions.outDir ?? baseConfig.compilerOptions.outDir).toBe("dist");
    expect(tsconfig.include).toEqual(["src/"]);
    // Incremental output would let tsc skip emitting after the clean step.
    expect(tsconfig.compilerOptions.incremental).not.toBe(true);
  });

  it("declares entry points that match the emitted flat dist layout", () => {
    const manifest = readDatabaseManifest();
    const root = (manifest.exports as Record<string, Record<string, string>> | undefined)?.["."];

    expect(manifest.main).toBe("dist/index.js");
    expect(manifest.types).toBe("dist/index.d.ts");
    expect(root).toMatchObject({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      require: "./dist/index.js",
      default: "./dist/index.js",
    });
    expect(manifest.files).toContain("dist");
    expect(manifest.scripts?.prepack).toBe("pnpm run build");
  });

  it("does not invoke a nested pnpm install from its prepare script", () => {
    expect(readDatabaseManifest().scripts?.prepare).not.toContain("pnpm i");
  });
});

describe("workspace prepare scripts", () => {
  it("does not invoke a nested pnpm install from shared either", () => {
    expect(readSharedManifest().scripts?.prepare).not.toContain("pnpm i");
  });
});
