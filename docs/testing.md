# Testing

This document describes the test suite, how to run it, and the conventions it uses.
The suite is a root-level Vitest project under `tests/`; it is deliberately outside
the workspace packages so it is neither compiled by them nor discovered by the bot's
dynamic loader.

## Commands

| Command | Effect |
| --- | --- |
| `pnpm run test` | Runs the whole suite once (`vitest run`) |
| `pnpm exec vitest run <path>` | Runs a single file, for example `pnpm exec vitest run tests/apps/discordBot/core/loader.test.ts` |
| `pnpm run test:watch` | Runs Vitest in watch mode |
| `pnpm run test:coverage` | Runs the suite once with the V8 coverage provider |

The suite contains 32 test files and 188 tests, all passing. See the coverage caveats
below before interpreting per-file numbers.

## Test inventory

| File | What it verifies |
| --- | --- |
| `tests/apps/discordBot/main.test.ts` | Boot sequence: missing credentials call `exit(1)` and shutdown, `LoadAll` runs before login, a rejected login is only logged, SIGINT/SIGTERM handlers, and `exitCode = 1` on SIGTERM (5 tests) |
| `tests/apps/discordBot/config/env.test.ts` | Mapping of `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `NODE_ENV`; `production` fallback; `undefined` fields (3 tests) |
| `tests/apps/discordBot/core/loader.test.ts` | All loader branches: default/named/`default.default` unwrapping, validation of each interaction kind, cache-busting imports, counts, and missing directories (29 tests) |
| `tests/apps/discordBot/core/client.test.ts` | `dsClient` is a Discord.js client with five gateway intents and four empty collections (3 tests) |
| `tests/apps/discordBot/core/shutdown.test.ts` | A successful destroy logs success; a destroy failure is logged without throwing (2 tests) |
| `tests/shared/logger.test.ts` | Log directory creation, ANSI colours, timestamp format, JSON metadata, `debug` gating by `NODE_ENV`, and the rotating `app-<date>.log` file (7 tests) |
| `tests/shared/index.test.ts` | Barrel exports the logger singleton with four level methods (2 tests) |
| `tests/database/env.test.ts` | `ENV.databaseUrl` from `DATABASE_CONNECTION_STRING`, missing value, and `dotenv.config()` (3 tests) |
| `tests/database/setup.test.ts` | Lazy client: no work at import, guard on first use (including empty strings), adapter/client construction, live-env precedence, method binding and `then` handling (7 tests) |
| `tests/database/index.test.ts` | Barrel re-exports `Prisma`, `PrismaClient`, `PrismaPg` and the `prisma` singleton built by `setup.ts` by identity (4 tests) |
| `tests/database/package-entry.test.ts` | Publishable-package contract: `database` builds with `tsconfig.build.json` into a flat `dist`, declared entry points match, and neither `prepare` script reinstalls recursively (4 tests) |
| `tests/database/prisma-config.test.ts` | `dotenv.config({ path: ".env" })`, schema/migration paths, and datasource URL resolution (4 tests) |
| `tests/schemas/bot-metadata-schema.test.ts` | Ajv Draft 2020-12 validation: valid example, category enum, SemVer, HTTPS URL, `additionalProperties`, default restrictions, and variable naming (10 tests) |
| `tests/apps/site/layout.test.tsx` | `RootLayout` renders children in the document shell, font classes, metadata, and Geist font loaders (5 tests, jsdom) |
| `tests/apps/site/page.test.tsx` | Home page renders one `Sign In` button and no headings, does not navigate on render, and pushes `/signin` on click (3 tests, jsdom) |
| `tests/apps/site/next-config.test.ts` | `cacheComponents` and `partialPrefetching` flags plus the Turbopack CSS rule (2 tests) |
| `tests/apps/site/api/health.test.ts` | `GET /api/health` returns JSON `{ ok: true }` (1 test) |
| `tests/apps/site/routes.test.ts` | Frontend path constants match the configured `signIn`/`signOut` values, registration convention and shared home destination (3 tests) |
| `tests/apps/site/auth-form.test.ts` | Sign-in/registration validation: happy path, bounds, email format, mismatch and error detection (13 tests) |
| `tests/apps/site/auth-pages.test.tsx` | Both route pages mount the correct form and expose metadata (2 tests, jsdom) |
| `tests/apps/site/sign-in-form.test.tsx` | Sign-in rendering, validation, loading/disabled state, credentials success/error, password reveal, three provider buttons with redirect states and safe `?error=` rendering (12 tests, jsdom) |
| `tests/apps/site/auth-options.test.ts` | Provider registration, minimal scopes, env names, JWT session policy, error page, Secure cookies, Discord id mapping, `signIn` event persistence and credentials authorization (15 tests) |
| `tests/apps/site/discord-login-flow.test.ts` | Real NextAuth callback handler with an in-memory adapter: first login, returning login, explicit link and a failed id write (4 tests) |
| `tests/apps/site/auth-user.test.ts` | Platform username/avatar mapping, the `createUser` adapter wrapper and Discord id forwarding (7 tests) |
| `tests/apps/site/auth-error.test.ts` | Generic NextAuth error-code mapping and non-leaking fallback (5 tests) |
| `tests/apps/site/register-form.test.tsx` | Registration rendering, validation summary, mismatch, password rule, loading/success focus, API error mapping (8 tests, jsdom) |
| `tests/apps/site/oauth.test.ts` | Shared provider ids/labels match the NextAuth registration and the `isOAuthProviderId` guard rejects untrusted values (4 tests) |
| `tests/apps/site/hash.test.ts` | Fixed Argon2id parameters for `createHash`, argument order for `verifyHash`, and error propagation (5 tests) |
| `tests/apps/site/auth-service.test.ts` | Filter forwarding, generated usernames, Argon2id hashing, explicit Prisma create columns, `setUserDiscordId` idempotence and conflict logging with the database mocked (10 tests) |
| `tests/apps/site/api/auth/register.test.ts` | `POST /api/auth/register`: normalisation, validation status codes (including `null`, arrays, scalars and malformed JSON), duplicate pre-check, P2002 race and 500 paths (10 tests) |
| `tests/apps/site/api/auth/nextauth-route.test.ts` | Catch-all handler exports and the adapter/options/logger wiring around `NextAuth()` (3 tests) |
| `tests/apps/site/auth-shell.test.tsx` | Skip link, single heading, labelled region, main landmark, children and footer slot (2 tests, jsdom) |
| `tests/apps/site/form-field.test.tsx` | Label/ARIA wiring, help/error exclusivity, controlled callbacks and password reveal toggle (5 tests, jsdom) |

`tests/apps/discordBot/core/fixtures/` contains the modules imported by the loader
tests: valid and invalid commands (including a nested directory), buttons, events,
menus, and modals, plus dynamic/anonymous variants and a `scanner/only.ts` file with
a non-module `README.txt` next to it. Fixtures are committed test data, not
application modules.

## Test conventions

- External boundaries are mocked: `dotenv`, `discord.js`, the Prisma packages,
  `next/font/google`, and the collaborators of `main.ts` (loader, client, `ENV`,
  shutdown, and the shared logger). Application logic is exercised directly.
- `main.ts` runs its boot sequence at import time, so `main.test.ts` calls
  `vi.resetModules()` and re-imports it for each case. `process.exit` is a no-op by
  default and is replaced with a throwing implementation in the missing-credentials
  test. The relative mocked specifiers use the `.js` extension, which Vite maps back
  to the `.ts` sources.
- Loader fixtures are imported through `file://` URLs with a `?update=<timestamp>`
  query so each test gets a fresh module instance. The TypeScript in these fixtures
  and in the sources is transformed by Vitest/Vite, not by Node's native loader.
- Component tests use `@testing-library/react` with jsdom. The layout test emits a
  React warning about rendering `<html>` inside a container div; the assertions still
  pass and the warning is pre-existing.
- Tests that assert calls made during module evaluation (the NextAuth catch-all
  route) record arguments in plain closure arrays rather than `vi.fn()` spies:
  the hoisted spy instance observed by the mock factories can differ from the one
  the test scope reads, so `mock.calls` stays empty.
- The shared-logger tests write to a temporary directory under `/tmp/opencode` and
  temporarily change the working directory inside the Vitest worker, so they do not
  touch the repository's `logs/` directory.

## Resolution aliases

`vitest.config.js` adds aliases that exist only for the test process:

| Alias | Target | Reason |
| --- | --- | --- |
| `shared` | `shared/src/index.ts` | Tests run without building the gitignored `shared/dist` |
| `discord.js`, `dotenv` | The bot package's `node_modules` links | These are workspace-package dependencies, not root dependencies |
| `@prisma/client`, `@prisma/adapter-pg`, `@prisma/config` | The database package's `node_modules` links | Mocks must bind to the same module ids the sources import; tests never need a generated client |
| `react`, `react-dom` (and subpaths) | The site package's copies | Keeps a single React instance for `@testing-library/react` |
| `next/font/google` | Its Next.js build stub | Allows the layout test to mock the specifier |
| `next-auth`, `next-auth/*` (including `react`), `next/link`, `next/navigation` | The site package's copies | Root-level tests mock these framework boundaries and import the pure provider config, so specifiers must bind to the site's modules |
| `@/*` | `apps/site/src/*` | Mirrors the site tsconfig alias for components imported by tests |
| `database`, `argon2`, `@auth/prisma-adapter` | `database/src/index.ts` and the site package's own copies | Root tests mock these site dependencies, so their specifiers must resolve to the ids the site sources import |

The `@vitejs/plugin-react` plugin enables the automatic JSX runtime for `.tsx`
sources, and `test.exclude` uses `**/node_modules/**` so nested installs cannot leak
dependency test files into the suite.

## TypeScript checking of tests

`tests/tsconfig.json` uses `esnext`/`bundler` resolution to match `apps/site`, plus
the DOM library, `allowImportingTsExtensions`, React and NextAuth type aliases and
the site's `@/*` path alias, so the site component and auth-config tests typecheck. It supports both ESLint's
type-aware `projectService` and
the `tests/` leg of `pnpm run typecheck`, which now covers the bot, `shared`, `tests/`
and `apps/site`.

## Coverage caveats

With `pnpm run test:coverage`, some files appear with `0%` even though their behavior
is exercised:

- `shared/src/index.ts` and `database/src/index.ts` contain only re-export
  statements; `shared` is additionally reached through an alias with mocked
  dependencies, so no executable statements are attributed to either file.
- Fixture modules imported natively through `file://` URLs show low or zero coverage
  rows that do not reflect the loader tests' branch coverage.
- `apps/site/src/app/globals.css` is reported at `0%` because it is a stylesheet,
  not executable code.

The meaningful coverage numbers are those for `apps/discordBot/src`,
`shared/src/utils/logger.ts`, `database/src`, and the site TypeScript modules.

## Related documents

- [Development workflow](./development.md#tests)
- [Configuration](./configuration.md#automation-configuration)
- [Documentation index](./README.md)
