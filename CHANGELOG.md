# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.3.0]

### Added

- 2026-11-27 — Data model: `BotVersion` gives bots independent, immutable release
  history while `Bot.version` stays as a compatibility mirror; `Distribution`
  records generated packages per user with a 72-hour expiry and no persisted
  environment values or signed URLs. Added the additive migration
  `20261127130000_add_distributions_and_bot_versions` and contract tests.
- 2026-11-27 — Discord bot: `dispatchInteraction` routes commands, buttons, select
  menus and modals (including predicate `customId` values), the
  `interactionCreate` event module subscribes it, and `registerCommands` publishes
  the loaded slash commands through Discord's REST API before login.
- 2026-11-27 — Site account flows: `/signout` page with a `signOut()` button, and
  `/account` page with linked-provider review/unlink through the authenticated
  `GET`/`DELETE /api/account/providers` endpoints, guarded against removing the
  last sign-in method.

### Changed

- 2026-11-27 — CI now pins pnpm 12.23.0, matching `devEngines` and both Dockerfiles.
- 2026-11-27 — Package versions: `database` 0.2.0 → 0.3.0, `discord-bot` 0.1.0 →
  0.2.0 and `site` 0.2.0 → 0.3.0 (new backwards-compatible models, modules and routes).
- 2026-11-27 — `ROADMAP.md`, `README.md` and `docs/` now describe the implemented
  data model, bot dispatcher, account settings and CI pin; deployment to Discord
  and live OAuth verification remain explicitly blocked.

## [v0.2.0]

### Added

- 2026-11-27 — Made `docs/api_documentation.md` the canonical API reference: it
  now covers `/api/health` in addition to `POST /api/auth/register` and the
  NextAuth catch-all routes, with internal flow, validation limits, error mapping,
  session policy, account-linking rationale and curl examples. No Swagger/OpenAPI
  file exists in the repository, so none was created or duplicated.
- 2026-11-27 — Recorded the current working-tree feature set in the changelog:
  Argon2id password hashing, email/password and GitHub/Google/Discord sign-in,
  four Prisma migrations including the NextAuth adapter models, and the lazy
  `prisma` singleton exported by the `database` barrel.

### Changed

- 2026-11-27 — Re-audited every source, test, configuration and documentation
  file against the code. Added the one missing JSDoc block (`PROVIDER_ICONS` in
  `signInForm.tsx`) and corrected four stale comments that still described the
  Prisma client as eager and the Suspense boundary as client-side. No code was
  modified.
- 2026-11-27 — Corrected the pnpm pin from 12.18.0 to 12.23.0 in `README.md`,
  `docs/getting-started.md`, `docs/development.md` and `AGENTS.md` to match the
  root `devEngines` field and both Dockerfiles. `.github/workflows/ci.yml` still
  pins 12.18.0; changing CI was considered out of scope for this update and is
  recorded in `docs/configuration.md`.
- 2026-11-27 — Corrected the database status across `README.md`,
  `docs/architecture.md`, `SECURITY.md` and `AGENTS.md`: the site imports the
  barrel for registration and auth, while the bot declares the dependency without
  importing it. The barrel exports the lazy `prisma` proxy, which reads the
  connection string on first use rather than at import time.
- 2026-11-27 — Corrected `docs/data-model.md` to state that four migrations are
  present, that `User.password` became `passwordHash`, and that registration also
  writes the `User` table.
- 2026-11-27 — Removed the "Hello World" landing-page description from
  `docs/architecture.md` and `docs/getting-started.md`; the page is a placeholder
  with a Sign In button. Clarified that the brand-identity and bot-standard
  documents are target-state specifications where they describe surfaces not yet
  implemented.
- 2026-11-27 — Clarified in `docs/api_documentation.md` and `ROADMAP.md` that
  NextAuth clears the JWT session via `/api/auth/signout`, but the configured
  `/signout` page has no App Router file yet.
- 2026-11-24 — Audited every source, test, configuration and documentation file
  against the code. All exported functions, classes, interfaces, types and enums
  already carried precise JSDoc and non-obvious logic already had inline comments,
  so no source file required a change and no code was modified.
- 2026-11-24 — Corrected the repository-history note below: the history contains
  thirteen commits (`08f676e` through `7a62ddc`), and only the initial commit added
  `LICENSE`.
- 2026-11-24 — Corrected `SECURITY.md`, which claimed `CHANGELOG.md` contained
  only an `[Unreleased]` section; the release work was recorded under `[v0.1.0]`.
- 2026-11-24 — Extended `docs/data-model.md` with the optional `email` and
  `passwordHash` fields on `User` (the column had previously been named `password`)
  and the follow-up migrations present in `database/prisma/migrations/`.

### Removed

- 2026-11-27 — Removed the claim that the site is a plain scaffold and that no
  application imports `database`; both were contradicted by the auth routes and
  services in `apps/site`.
- 2026-11-24 — Removed the documentation references to
  `docs/bot-standard/timeless-discord-bot-main.zip`, which is deleted in the
  working tree. The reason for deleting the archive is not recorded in the
  repository; the remaining bot-standard templates still document the required
  repository files.

## [v0.1.0]

No tagged release exists yet, so every change below is unreleased. This section
records the work committed on `main`, from the initial `LICENSE` commit
(`08f676e`) through the documentation cleanup at `7a62ddc` (13 commits); no
per-entry dates are available. Still-uncommitted work is listed under
`[Unreleased]` above.

### Added

- Repository foundation: Apache-2.0 `LICENSE` (the only file in commit `08f676e`), the project `README.md` and the ten-phase `ROADMAP.md`, the contribution and community policies (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `AGENTS.md`), and a pnpm 12.18.0 / Node.js 24 monorepo with the `apps/site`, `apps/discordBot`, `shared` and `database` workspaces, a `pnpm-lock.yaml` lockfile, a `catalog/` placeholder and root scripts for linting, type-checking, testing, formatting and Docker operations.
- Development tooling: strict TypeScript base options in `tsconfig.base.json` with per-package configs, an ESLint 10 flat configuration covering TypeScript, JSON and CSS with Prettier violations reported as errors, Prettier configuration and ignore rules, and a Vitest 5 configuration that aliases workspace dependencies, React and mocked modules so tests resolve from the root `tests/` directory.
- Discord bot skeleton (`apps/discordBot`): mandatory `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` validation with `NODE_ENV` defaulting to `production`, a discord.js v14 client with the Guilds, MessageContent, GuildMembers, GuildMessages and DirectMessages intents, typed interaction contracts, and a recursive loader for commands, events, buttons, select menus and modals that validates module shapes and cache-busts dynamic imports. Handlers are kept in collections on the shared client, with graceful SIGINT/SIGTERM shutdown; no `interactionCreate` dispatcher or slash-command REST registration exists yet.
- Website scaffold (`apps/site`): a Next.js 16, React 19 and Tailwind CSS 4 application using Turbopack with `cacheComponents` and `partialPrefetching`, Geist fonts and Veyra metadata in the root layout, a placeholder landing page at `/`, and a dependency-free `/api/health` endpoint returning `{ "ok": true }` for the Compose healthcheck. The account screens and `/api/auth/*` routes were added later and are recorded under `[Unreleased]`.
- Shared package (`shared`): a winston-backed `logger` facade with a colourised console transport, a daily rotating `logs/app-<date>.log` file for warn/error records with seven-day retention, and debug output enabled only when `NODE_ENV=development` at import time.
- Database package (`database`): a Prisma 7 data layer with `@prisma/adapter-pg`, a `DATABASE_CONNECTION_STRING` guard and PostgreSQL client singleton, a barrel re-exporting the generated client and `PrismaPg` (the lazy `prisma` singleton came later), models for users, bots and categories, bot-add and developer-authorization requests, tickets and ticket messages, reviews, warnings and private test categories/channels with their enums, and an initial migration. Both applications declare the package as a dependency; at this point no application imported it (the site's auth routes, added later, now do).
- Bot submission standard: the Veyra Bot Metadata Specification 1.0 (`docs/specifications/bot-metadata.md`), the matching `veyra.json` JSON Schema (Draft 2020-12) in `schemas/`, the Veyra Bot Standard (VBS 1.0.0) with templates for `global_settings.json`, `.env.example`, `Dockerfile`, README and license, and `docs/ADDING_BOTS.md`.
- Documentation: a `docs/` index and guides for getting started, architecture, modules and API reference, the data model, configuration, development workflow, testing and deployment, plus a brand-identity and design-system section covering logo usage, tokens, components, layouts and accessibility.
- Test suite (`tests/`): 17 root-level Vitest files at that point (32 in the current working tree) covering bot configuration, loader, client, shutdown and boot, site health route, layout, page and Next configuration, database environment, client setup, barrel exports and Prisma configuration, the shared logger and exports, and Ajv validation of the `veyra.json` schema, with loader fixtures and shared resolution aliases.
- CI and Git automation: a GitHub Actions workflow triggered by pushes to `main` and pull requests that installs with `--frozen-lockfile` and runs lint, typecheck, `pnpm -r build` and tests, plus Husky `pre-commit` (lint-staged) and `pre-push` (typecheck and test) hooks.
- Deployment configuration: multi-stage Docker images for the site and bot, an nginx image, a Compose stack with PostgreSQL 18, site, nginx and bot services with healthchecks and required environment variables, an active HTTP reverse proxy with WebSocket upgrade handling, and documentation for the still-commented HTTPS block and the gitignored TLS certificate pair.

### Security

- Dependency overrides in `pnpm-workspace.yaml` pin `effect` to 3.22.1 and `minimatch` to 11.0.1 to avoid releases affected by GHSA-7589-6fvf-x4pw and GHSA-g3hv-75wg-m249; the repository states both overrides were verified with lint, typecheck, tests and a full build.
- `.gitignore` excludes `.env`, `.env.local`, `.env.*.local` and TLS key/certificate files, while `.dockerignore` excludes environment files from container build contexts; `.env.example` documents variable names using placeholder values only.
