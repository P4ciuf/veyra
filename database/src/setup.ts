/**
 * Lazily initialized Prisma client singleton for the `database` package.
 *
 * Importing this module — directly or through the package barrel — does not
 * read configuration or construct a client. Next.js evaluates route modules
 * while collecting page data during `next build`, where runtime-only variables
 * such as `DATABASE_CONNECTION_STRING` are not available. The guard and the
 * construction therefore run on the first property access instead, so an
 * import of the barrel stays free of runtime environment requirements.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";

/** The real client, created once on first use. */
let client: PrismaClient | undefined;

/**
 * Resolves and caches the Prisma client.
 *
 * `ENV` snapshots `process.env` when `env.ts` is first imported, which can be
 * build time for a bundled site; the live environment is preferred so a value
 * present when the server starts wins over any build-time snapshot.
 *
 * @returns The shared client, constructed on the first call
 * @throws {Error} When the connection string is missing or empty
 */
function getClient(): PrismaClient {
  if (!client) {
    const connectionString = process.env.DATABASE_CONNECTION_STRING || ENV.databaseUrl;

    if (!connectionString) {
      // The message keeps the historical `DATABASE_URL` name for compatibility with
      // existing log searches; the value actually read is DATABASE_CONNECTION_STRING.
      throw new Error("DATABASE_URL not found in environment variables");
    }

    client = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  return client;
}

/**
 * Shared Prisma client, proxied so no connection or configuration is needed at
 * import time.
 *
 * The proxy target inherits `PrismaClient.prototype` only to keep `instanceof`
 * consistent with an eagerly created client; every other property is forwarded
 * to the real instance. Methods are bound to that instance because Prisma's
 * model delegates depend on their owning client.
 */
export const prisma = new Proxy(Object.create(PrismaClient.prototype) as PrismaClient, {
  get(_target, property) {
    // Promise checks must not initialize a database connection as a side effect.
    if (property === "then") {
      return undefined;
    }

    const instance = getClient();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
