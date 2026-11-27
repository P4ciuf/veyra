/**
 * Contract tests for the version-history and distribution data model.
 *
 * These models are consumed by the planned distribution service, not by running
 * application code yet, so schema-level assertions are the fastest way to pin
 * the design: an independent `BotVersion` per release, a per-user
 * `Distribution` with an expiry, and a migration that can actually create them.
 * Reading the files keeps the suite independent of `prisma generate` and of a
 * live PostgreSQL instance.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Reads a UTF-8 file relative to this test file.
 *
 * @param relativePath - Path from `tests/database/` to the target file
 * @returns The file contents with line endings normalized to LF
 */
function read(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8").replace(
    /\r\n/g,
    "\n",
  );
}

/**
 * Extracts the body of a Prisma model declaration.
 *
 * @param source - Contents of a `.prisma` file
 * @param name - Model name to look up
 * @returns The declaration body, including its closing brace
 */
function modelBlock(source: string, name: string): string {
  const start = source.indexOf(`model ${name} {`);
  expect(start, `model ${name} must exist`).toBeGreaterThanOrEqual(0);
  return source.slice(start, source.indexOf("\n}", start));
}

/** Prisma schema of the catalog bots, including `BotVersion`. */
const botsSchema = read("../../database/prisma/schema/bots.prisma");
/** Prisma schema of the generated packages. */
const distributionSchema = read("../../database/prisma/schema/distribution.prisma");
/** Prisma schema of the platform user. */
const userSchema = read("../../database/prisma/schema/user.prisma");
/** SQL that adds both tables to an existing database. */
const migration = read(
  "../../database/prisma/migrations/20261127130000_add_distributions_and_bot_versions/migration.sql",
);

describe("bot version and distribution data model", () => {
  it("keeps the existing Bot.version while adding independent version history", () => {
    const bot = modelBlock(botsSchema, "Bot");

    expect(bot).toMatch(/^\s{2}version\s+String/m);
    expect(bot).toContain("versions      BotVersion[]");
    expect(bot).toContain("distributions Distribution[]");
    expect(bot).not.toContain("publishedAt");
  });

  it("makes each bot version immutable and unique per bot", () => {
    const botVersion = modelBlock(botsSchema, "BotVersion");

    expect(botVersion).toContain("botId     String");
    expect(botVersion).toContain("version   String");
    expect(botVersion).toContain("filePath  String");
    expect(botVersion).toContain("changelog String?");
    expect(botVersion).toContain("@@unique([botId, version])");
    expect(botVersion).toMatch(
      /bot\s+Bot\s+@relation\(fields: \[botId\], references: \[id\], onDelete: Cascade\)/,
    );
    expect(botVersion).toContain("distributions Distribution[]");
  });

  it("stores only non-secret distribution metadata with an explicit expiry", () => {
    const distribution = modelBlock(distributionSchema, "Distribution");

    expect(distribution).toMatch(/\n\s{2}botId\s+String\n/);
    expect(distribution).toMatch(/\n\s{2}versionId\s+String\n/);
    expect(distribution).toMatch(/\n\s{2}userId\s+String\n/);
    expect(distribution).toMatch(/\n\s{2}displayName\s+String\?\n/);
    expect(distribution).toMatch(/\n\s{2}description\s+String\?\n/);
    expect(distribution).toMatch(/\n\s{2}packagePath\s+String\n/);
    expect(distribution).toMatch(/\n\s{2}expiresAt\s+DateTime\n/);
    // Environment values and signed URLs are generated on demand, never persisted.
    expect(distribution).not.toMatch(/^\s{2}\w*(token|secret|apiKey|env)\w*\s/im);
    expect(distribution).toContain("@@index([userId, createdAt])");
    expect(distribution).toContain("@@index([expiresAt])");
  });

  it("links distributions to a site user by id and preserves version history on delete", () => {
    const distribution = modelBlock(distributionSchema, "Distribution");
    const user = modelBlock(userSchema, "User");

    expect(distribution).toMatch(
      /user\s+User\s+@relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
    );
    expect(distribution).toMatch(
      /version\s+BotVersion\s+@relation\(fields: \[versionId\], references: \[id\], onDelete: Restrict\)/,
    );
    expect(user).toContain("distributions         Distribution[]");
  });

  it("provides an additive migration with the matching tables, indexes and constraints", () => {
    expect(migration).toContain('CREATE TABLE "BotVersion"');
    expect(migration).toContain('CREATE TABLE "Distribution"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "BotVersion_botId_version_key" ON "BotVersion"("botId", "version")',
    );
    expect(migration).toContain(
      'CREATE INDEX "Distribution_userId_createdAt_idx" ON "Distribution"("userId", "createdAt")',
    );
    expect(migration).toContain(
      'CREATE INDEX "Distribution_expiresAt_idx" ON "Distribution"("expiresAt")',
    );
    expect(migration).toContain(
      'ADD CONSTRAINT "BotVersion_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE',
    );
    expect(migration).toContain(
      'ADD CONSTRAINT "Distribution_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BotVersion"("id") ON DELETE RESTRICT',
    );
    expect(migration).toContain(
      'ADD CONSTRAINT "Distribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
    );
    // The migration must not mutate existing catalog rows or drop existing columns.
    expect(migration).not.toMatch(/DROP |ALTER TABLE "Bot"|ALTER TABLE "User"/);
  });
});
