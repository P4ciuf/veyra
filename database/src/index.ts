/**
 * Entry point of the `database` workspace package.
 *
 * Re-exports the entire generated `@prisma/client` surface (including the
 * `Prisma` namespace, `PrismaClient` and the generated enums) plus the
 * `PrismaPg` driver adapter from `@prisma/adapter-pg`, plus the shared `prisma`
 * singleton from `setup.ts`. That singleton is lazily initialized: importing
 * this barrel neither constructs a client nor requires
 * `DATABASE_CONNECTION_STRING`, and the guard runs on first use.
 *
 * Both applications declare `database` as a workspace dependency; the site's
 * auth and registration code imports this barrel. A generated Prisma client
 * (`pnpm --filter database generate`) must exist before this module can be
 * imported.
 */
export * from "@prisma/client";
export { PrismaPg } from "@prisma/adapter-pg";
export { prisma } from "./setup";
