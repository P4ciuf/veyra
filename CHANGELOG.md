# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 2026-11-24 — Audited every source, test, configuration and documentation file
  against the code. All exported functions, classes, interfaces, types and enums
  already carry precise JSDoc and non-obvious logic already has inline comments,
  so no source file required a change and no code was modified.
- 2026-11-24 — Corrected the repository-history note below: the history contains
  ten commits (`08f676e` through `5fbfefa`), and only the initial commit added
  `LICENSE`.
- 2026-11-24 — Corrected `SECURITY.md`, which claimed `CHANGELOG.md` contained
  only an `[Unreleased]` section; the release work was recorded under `[0.1.0]`.
- 2026-11-24 — Extended `docs/data-model.md` with the optional `email` and
  `password` fields on `User` and the follow-up migration present in
  `database/prisma/migrations/`.

### Removed

- 2026-11-24 — Removed the documentation references to
  `docs/bot-standard/timeless-discord-bot-main.zip`, which is deleted in the
  working tree. The reason for deleting the archive is not recorded in the
  repository; the remaining bot-standard templates still document the required
  repository files.

## [0.1.0]

No tagged release exists yet, so every change below is unreleased. This section
records the work committed on `main`, from the initial `LICENSE` commit
(`08f676e`) through the Docker Compose and nginx setup (`5fbfefa`); no
per-entry dates are available.

### Added

- Repository foundation: Apache-2.0 `LICENSE` (the only file in commit `08f676e`), the project `README.md` and the ten-phase `ROADMAP.md`, the contribution and community policies (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `AGENTS.md`), and a pnpm 12.18.0 / Node.js 24 monorepo with the `apps/site`, `apps/discordBot`, `shared` and `database` workspaces, a `pnpm-lock.yaml` lockfile, a `catalog/` placeholder and root scripts for linting, type-checking, testing, formatting and Docker operations.
- Development tooling: strict TypeScript base options in `tsconfig.base.json` with per-package configs, an ESLint 10 flat configuration covering TypeScript, JSON and CSS with Prettier violations reported as errors, Prettier configuration and ignore rules, and a Vitest 5 configuration that aliases workspace dependencies, React and mocked modules so tests resolve from the root `tests/` directory.
- Discord bot skeleton (`apps/discordBot`): mandatory `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` validation with `NODE_ENV` defaulting to `production`, a discord.js v14 client with the Guilds, MessageContent, GuildMembers, GuildMessages and DirectMessages intents, typed interaction contracts, and a recursive loader for commands, events, buttons, select menus and modals that validates module shapes and cache-busts dynamic imports. Handlers are kept in collections on the shared client, with graceful SIGINT/SIGTERM shutdown; no `interactionCreate` dispatcher or slash-command REST registration exists yet.
- Website scaffold (`apps/site`): a Next.js 16, React 19 and Tailwind CSS 4 application using Turbopack with `cacheComponents` and `partialPrefetching`, Geist fonts and Veyra metadata in the root layout, a placeholder landing page at `/`, and a dependency-free `/api/health` endpoint returning `{ "ok": true }` for the Compose healthcheck.
- Shared package (`shared`): a winston-backed `logger` facade with a colourised console transport, a daily rotating `logs/app-<date>.log` file for warn/error records with seven-day retention, and debug output enabled only when `NODE_ENV=development` at import time.
- Database package (`database`): a Prisma 7 data layer with `@prisma/adapter-pg`, a `DATABASE_CONNECTION_STRING` guard and PostgreSQL client singleton, a barrel re-exporting the generated client and `PrismaPg`, models for users, bots and categories, bot-add and developer-authorization requests, tickets and ticket messages, reviews, warnings and private test categories/channels with their enums, and an initial migration. Both applications declare the package as a dependency, but no application imports it yet.
- Bot submission standard: the Veyra Bot Metadata Specification 1.0 (`docs/specifications/bot-metadata.md`), the matching `veyra.json` JSON Schema (Draft 2020-12) in `schemas/`, the Veyra Bot Standard (VBS 1.0.0) with templates for `global_settings.json`, `.env.example`, `Dockerfile`, README and license, and `docs/ADDING_BOTS.md`.
- Documentation: a `docs/` index and guides for getting started, architecture, modules and API reference, the data model, configuration, development workflow, testing and deployment, plus a brand-identity and design-system section covering logo usage, tokens, components, layouts and accessibility.
- Test suite (`tests/`): 17 root-level Vitest files covering bot configuration, loader, client, shutdown and boot, site health route, layout, page and Next configuration, database environment, client setup, barrel exports and Prisma configuration, the shared logger and exports, and Ajv validation of the `veyra.json` schema, with loader fixtures and shared resolution aliases.
- CI and Git automation: a GitHub Actions workflow triggered by pushes to `main` and pull requests that installs with `--frozen-lockfile` and runs lint, typecheck, `pnpm -r build` and tests, plus Husky `pre-commit` (lint-staged) and `pre-push` (typecheck and test) hooks.
- Deployment configuration: multi-stage Docker images for the site and bot, an nginx image, a Compose stack with PostgreSQL 18, site, nginx and bot services with healthchecks and required environment variables, an active HTTP reverse proxy with WebSocket upgrade handling, and documentation for the still-commented HTTPS block and the gitignored TLS certificate pair.

### Security

- Dependency overrides in `pnpm-workspace.yaml` pin `effect` to 3.22.1 and `minimatch` to 11.0.1 to avoid releases affected by GHSA-7589-6fvf-x4pw and GHSA-g3hv-75wg-m249; the repository states both overrides were verified with lint, typecheck, tests and a full build.
- `.gitignore` excludes `.env`, `.env.local`, `.env.*.local` and TLS key/certificate files, while `.dockerignore` excludes environment files from container build contexts; `.env.example` documents variable names using placeholder values only.
