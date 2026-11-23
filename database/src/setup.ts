/**
 * Prisma client singleton for the `database` package.
 *
 * The module performs its work at import time: it guards the connection string,
 * builds the PostgreSQL driver adapter and instantiates the generated
 * `PrismaClient`. Importing it therefore throws when
 * `DATABASE_CONNECTION_STRING` is missing or empty.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";

if (!ENV.databaseUrl) {
  // The message keeps the historical `DATABASE_URL` name for compatibility with
  // existing log searches; the value actually read is DATABASE_CONNECTION_STRING.
  throw new Error("DATABASE_URL not found in environment variables");
}

const adapter = new PrismaPg({
  connectionString: ENV.databaseUrl,
});

/**
 * Shared Prisma client wired to the PostgreSQL driver adapter.
 * The package barrel re-exports `@prisma/client` and `PrismaPg` but not this
 * singleton, and the package `exports` map exposes only the root entry, so consumers must
 * import this file through a relative workspace path rather than
 * `database/src/setup`.
 */
export const prisma = new PrismaClient({ adapter });
