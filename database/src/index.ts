/**
 * Entry point of the `database` workspace package.
 *
 * Re-exports the entire generated `@prisma/client` surface (including the
 * `Prisma` namespace, `PrismaClient` and the generated enums) plus the
 * `PrismaPg` driver adapter from `@prisma/adapter-pg`. The shared client
 * singleton itself lives in `setup.ts` and is intentionally not re-exported
 * here: importing this barrel does not construct a client or read
 * `DATABASE_CONNECTION_STRING`.
 *
 * Both applications declare `database` as a workspace dependency, but no
 * source file imports it yet. A generated Prisma client
 * (`pnpm --filter database generate`) must exist before this module can be
 * imported.
 */
export * from "@prisma/client";
export { PrismaPg } from "@prisma/adapter-pg";
