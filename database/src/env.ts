import dotenv from "dotenv";
// dotenv reads a plain `.env` file from the process cwd at import time. When
// this package is imported by an application, that cwd is the application's
// own, so the host app's `.env` provides `DATABASE_CONNECTION_STRING` — not a
// `.env` file inside this package. Variants such as `.env.local` are never
// read. The Prisma CLI instead loads `.env` through `prisma.config.ts`; because
// the package scripts run with `database/` as cwd, that resolves to
// `database/.env`.
dotenv.config();

/**
 * Database configuration resolved once at import time from the process
 * environment.
 *
 * Values are snapshotted when this module is first imported: later changes to
 * `process.env` have no effect on this object.
 */
export const ENV = {
  /**
   * PostgreSQL connection string consumed by the Prisma driver adapter in
   * `setup.ts`; `setup.ts` throws at import time when it is missing.
   */
  databaseUrl: process.env.DATABASE_CONNECTION_STRING,
};
