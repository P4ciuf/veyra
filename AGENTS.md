# AGENTS.md

Veyra is an early-stage Discord-bot distribution platform. `README.md` and `ROADMAP.md` describe the target product, not shipped behavior; the `veyra.json` contract is only a spec plus JSON Schema (`schemas/bot-metadata.schema.json`), exercised by a root-level Ajv test but consumed by no application code.

## Commands

- Use Node.js 24 (CI, Dockerfiles, README) and pnpm 12.23.0 (pinned via `devEngines.onFail: download`; CI still pins 12.18.0); use pnpm, not npm/yarn, for repo commands.
- `pnpm-workspace.yaml` pins `overrides` (`effect`, `minimatch`) for security advisories and `allowBuilds` for Prisma, esbuild and argon2 (native); keep both when touching the lockfile or install config.
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
- No path aliases in bot/shared code: use `import { logger } from "shared"` and relative specifiers, since tsc does not rewrite `paths` on emit. Only `apps/site` uses `@/*` (its own tsconfig, resolved by Next). The `vitest.config.js` aliases are test-process only: `shared`, `database` and `@/*` point at TypeScript sources; workspace-only packages (`discord.js`, `dotenv`, `@prisma/*`, React/react-dom, `next-auth`, `next/link`, `next/navigation`, `argon2`, `@auth/prisma-adapter`, `next/font/google`) bind to the owning package's `node_modules` so root-level `vi.mock` can resolve them.
- All tests live in root-level `tests/` (mirroring `apps/*`, `database`, `shared`, `schemas`), outside the workspace packages: put new tests there, not beside the source. That keeps them out of package builds and the bot loader. They mock Prisma and resolve workspace deps through `vitest.config.js` aliases, so `pnpm test` needs neither `shared/dist` nor a generated Prisma client. Site tests use jsdom + `@testing-library/react` and mock framework boundaries (`next-auth`, `next/navigation`, `database`, argon2) through those aliases.
- `database` is a Prisma 7 + `@prisma/adapter-pg` layer with the URL from `DATABASE_CONNECTION_STRING` via `prisma.config.ts` (`schema.prisma` has no `url`). The site imports it from its registration and auth routes; the bot declares it but does not import it. The barrel re-exports `@prisma/client`, `PrismaPg` and the lazy `prisma` proxy from `src/setup.ts`, which reads the connection string on first property access (not at import) and throws only then when it is missing.
- Use `logger` from `shared`, not `console`: rotating `logs/app-<date>.log` (warn and above, 7-day retention) under the process cwd; `debug` only when `NODE_ENV=development` at import time.

## Gotchas

- `dotenv.config()` in `apps/discordBot/src/config/env.ts` reads `.env` from the process cwd (`apps/discordBot` under the pnpm filter); `.env.local` is ignored. `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are mandatory (exit 1); `NODE_ENV` defaults to `production`. Root `.env.example` documents the names: copy it to root `.env` for compose and to `apps/discordBot/.env` for local bot runs. Prisma separately reads `database/.env` via `dotenv.config({ path: ".env" })`.
- The site's auth routes (`/api/auth/*`) need `NEXTAUTH_SECRET` or they return 500; `NEXTAUTH_URL`, the GitHub/Google/Discord OAuth credentials and `DATABASE_CONNECTION_STRING` come from the root `.env` under compose. The database client is lazy, so `next build` needs no database URL.
- Privileged intents `MessageContent` and `GuildMembers` are enabled in code; enable them in the Discord developer portal or login fails (logged, not thrown).
- Root `package.json` is ESM (`"type": "module"`), the bot package is not — it runs as CommonJS so `loader.ts` can use `__dirname`. Do not add `"type": "module"` to the bot.
- `tsconfig.base.json` enables `strict` plus `noUncheckedIndexedAccess`; guard indexed array and record access.
- `typescript` is aliased to `@typescript/typescript6` for typescript-eslint; `@typescript/native` (TS 7) provides the `tsc` binary. Do not repoint `typescript` to v7 until typescript-eslint supports its API.
- `database`'s `build` script runs `tsc -p tsconfig.build.json` after clearing `dist`, so the emitted flat `dist/index.js` and `dist/index.d.ts` match `main`/`types`/`exports`. Like `shared`, the package has `files: ["dist"]` and a `prepack` build; `prisma generate` runs through the `prebuild` script.
- `docker-compose.yaml` needs root `.env`; `apps/site/src/app/api/health/route.ts` is the site healthcheck target. The nginx `map` defining `$connection_upgrade` is active (the HTTPS block is still commented, so the `ssl/` files are not read yet); the bot has no healthcheck because it exposes no HTTP server. Port 443 is published but has no listener until HTTPS is enabled.
- Catalog bots are never added via PR (submit through the website); open an issue before large core changes — see `CONTRIBUTING.md`.
- Convention (`docs/development.md`): English comments/docs; JSDoc on every exported function, class, type, enum and reusable helper, `///` on Prisma models; inline comments only for non-obvious logic. `.sql` migrations are exempt.

## Versioning

- After every change or operation that touches code, the agent must inspect the diff (`git diff`, plus `git diff --staged` if relevant) and bump the `version` field in the `package.json` of the package or app it worked on: `apps/discordBot` (`discord-bot`), `apps/site`, `shared`, `database`. Touch the root `package.json` only for root-level changes (tooling, CI, lint/test config, workspace config).
- Use semver, decided from the diff:
  - **patch**: bug fixes, internal refactors, dependency or config tweaks with no behavior change.
  - **minor**: new backwards-compatible features (new command, event, route, exported function, optional env var, additive Prisma change).
  - **major**: breaking changes (removed or renamed exports, required env var added or renamed, destructive Prisma schema change, incompatible `veyra.json` / `schemas/bot-metadata.schema.json` change).
- Compare against the version at `HEAD` (or `main`), not against the working tree: bump at most once per task, even if the work involves several edits. If the version is already bumped by the current uncommitted changes, raise it again only if the diff now warrants a higher level (e.g. patch → minor).
- Do not bump for changes that do not affect the package: docs-only (`docs/`, `*.md`), tests under root `tests/`, comments/formatting. If several packages are changed, bump each one according to its own diff.
- If a changed package is consumed by another workspace package (e.g. `shared` or `database`), check that the dependents' ranges still resolve (`workspace:*` needs no edit). Keep the lockfile consistent (`pnpm install`), since CI uses `--frozen-lockfile`.
- Report the bump in the final summary (e.g. `shared: 1.2.0 → 1.3.0 (minor: new exported helper)`).
