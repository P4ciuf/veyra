import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

// The Prisma 7 CLI loads this file with the package directory as cwd (the
// package scripts in `database/package.json` all run `prisma` from here), so
// the relative ".env" resolves to `database/.env`. This is separate from the
// application runtime: the host application's dotenv call in `src/env.ts`
// loads the `.env` of the process cwd instead.
dotenv.config({ path: ".env" });

/**
 * Prisma CLI configuration for the `database` package.
 *
 * Points the CLI at the `prisma/schema.prisma` schema and feeds the datasource
 * URL from `DATABASE_CONNECTION_STRING` (the schema intentionally declares no
 * `url`; Prisma 7 reads it from this config). Commands are exposed as package
 * scripts: `pnpm --filter database generate|push|migrate|studio`.
 */
export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_CONNECTION_STRING,
  },
});
