# AGENTS.md

Veyra is an early-stage Discord-bot distribution platform. `README.md` and `ROADMAP.md` describe the target product, not shipped behavior; the `veyra.json` contract is only a spec plus JSON Schema (`schemas/bot-metadata.schema.json`), exercised by a root-level Ajv test but consumed by no application code.

## Commands

- Use Node.js 24 (CI, Dockerfiles, README) and pnpm 12.18.0 (pinned via `devEngines.onFail: download`); use pnpm, not npm/yarn, for repo commands.
- `pnpm-workspace.yaml` pins `overrides` (`effect`, `minimatch`) for security advisories and `allowBuilds` for Prisma/esbuild; keep both when touching the lockfile or install config.
- `pnpm install` runs workspace `prepare` scripts: it builds `shared/dist` and runs `prisma generate` + `tsc` for `database`. The bot resolves `shared` through gitignored `shared/dist`, so rebuild after deleting it.
- Build all packages: `pnpm -r build` (topological). Run the bot: `pnpm --filter discord-bot dev` (watch) or `pnpm --filter discord-bot start` (= `node dist/main.js`, needs a build first). Package name is `discord-bot`; folder is `apps/discordBot`.
- Quality gate, in this order: `pnpm run lint` → `pnpm run typecheck` → `pnpm run test`. CI (push to `main`, PRs) installs with `--frozen-lockfile`, then runs lint → typecheck → `pnpm -r build` → test; pre-push runs only typecheck + test, pre-commit runs `lint-staged`. Single test file: `pnpm exec vitest run <path>`. Also `pnpm run test:watch`, `pnpm run test:coverage`, `pnpm run format`.
- `pnpm run typecheck` covers `apps/discordBot`, `shared`, `tests/` and `apps/site`; `database` is compiled by its own build. ESLint reports Prettier violations as errors for TS files, but `.prettierignore` skips `docs/`, `*.yml` and `Dockerfile*`, so `pnpm run format` will not touch those.
- Baseline: lint, typecheck, tests and build pass. `css/no-important` is disabled in `eslint.config.mjs`, so the `!important` declarations in `docs/brand-identity/tokens/tokens.css` are intentional, not errors.
- Prisma CLI only via package scripts (`pnpm --filter database generate|push|migrate|studio|format`): `prisma.config.ts` and the schema resolve relative to `database/`, so a bare `prisma` from the repo root finds neither.
- Standalone bot image: `pnpm --filter discord-bot docker:build` / `docker:start` (the latter passes `--env-file .env`, resolved in `apps/discordBot`). Both application Dockerfiles copy the `database` workspace manifest, install with `--ignore-scripts` (skipping `prepare`), then build explicitly — do not rely on install-time builds inside images.

## Architecture and wiring

- `apps/discordBot/src/main.ts` validates env, calls `new Loaders().LoadAll()`, then logs in; SIGINT/SIGTERM call `shutdown()`. The boot sequence runs at import time.
- `src/core/loader.ts` recursively scans `src/commands`, `src/events` and `src/handlers/{buttons,menus,modals}` (missing dirs only warn). Modules must default-export or named-export `command`/`event`/`button`/`modal`/`menu` objects shaped by `src/types/interactions.ts`; invalid ones are logged and skipped. Imports use `?update=<timestamp>` cache busting.
- Handlers are only stored in collections on `dsClient` (`src/core/client.ts`). There is no `interactionCreate` listener and no REST command registration — loaded commands never reach Discord until both are added.
- No path aliases in bot/shared code: use `import { logger } from "shared"` and relative specifiers, since tsc does not rewrite `paths` on emit. Only `apps/site` uses `@/*` (its own tsconfig, resolved by Next). The `vitest.config.js` aliases (`shared` source, `discord.js`, `dotenv`, `@prisma/*`, React, `next/font/google`) are test-process only.
- All tests live in root-level `tests/` (mirroring `apps/*`, `database`, `shared`, `schemas`), outside the workspace packages: put new tests there, not beside the source. That keeps them out of package builds and the bot loader. They mock Prisma and resolve workspace deps through `vitest.config.js` aliases, so `pnpm test` needs neither `shared/dist` nor a generated Prisma client. Site component tests use jsdom + `@testing-library/react` through those aliases.
- `database` is standalone and imported by no application yet: Prisma 7 + `@prisma/adapter-pg`, URL from `DATABASE_CONNECTION_STRING` via `prisma.config.ts` (`schema.prisma` has no `url`). The barrel re-exports `@prisma/client` and `PrismaPg`, but not the `prisma` singleton in `src/setup.ts` (which throws at import when the URL is missing).
- Use `logger` from `shared`, not `console`: rotating `logs/app-<date>.log` (warn and above, 7-day retention) under the process cwd; `debug` only when `NODE_ENV=development` at import time.

## Gotchas

- `dotenv.config()` in `apps/discordBot/src/config/env.ts` reads `.env` from the process cwd (`apps/discordBot` under the pnpm filter); `.env.local` is ignored. `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are mandatory (exit 1); `NODE_ENV` defaults to `production`. Root `.env.example` documents the names: copy it to root `.env` for compose and to `apps/discordBot/.env` for local bot runs. Prisma separately reads `database/.env` via `dotenv.config({ path: ".env" })`.
- Privileged intents `MessageContent` and `GuildMembers` are enabled in code; enable them in the Discord developer portal or login fails (logged, not thrown).
- Root `package.json` is ESM (`"type": "module"`), the bot package is not — it runs as CommonJS so `loader.ts` can use `__dirname`. Do not add `"type": "module"` to the bot.
- `tsconfig.base.json` enables `strict` plus `noUncheckedIndexedAccess`; guard indexed array and record access.
- `typescript` is aliased to `@typescript/typescript6` for typescript-eslint; `@typescript/native` (TS 7) provides the `tsc` binary. Do not repoint `typescript` to v7 until typescript-eslint supports its API.
- `database`'s `build` script runs `tsc -p tsconfig.build.json` after clearing `dist`, so the emitted flat `dist/index.js` and `dist/index.d.ts` match `main`/`types`/`exports`. Like `shared`, the package has `files: ["dist"]` and a `prepack` build; `prisma generate` runs through the `prebuild` script.
- `docker-compose.yaml` needs root `.env`; `apps/site/src/app/api/health/route.ts` is the site healthcheck target. The nginx `map` defining `$connection_upgrade` is active (the HTTPS block is still commented, so the `ssl/` files are not read yet); the bot has no healthcheck because it exposes no HTTP server. Port 443 is published but has no listener until HTTPS is enabled.
- Catalog bots are never added via PR (submit through the website); open an issue before large core changes — see `CONTRIBUTING.md`.
- Convention (`docs/development.md`): English comments/docs; JSDoc on every exported function, class, type, enum and reusable helper, `///` on Prisma models; inline comments only for non-obvious logic. `.sql` migrations are exempt.
