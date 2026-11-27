# Development workflow

This document covers local setup, Git hooks, quality commands, and continuous integration.

For a shorter entry point see [Getting started](./getting-started.md). The module
surfaces are described in [Modules and API reference](./modules.md), the schema in
[Data model and storage](./data-model.md), the environment variables in
[Configuration](./configuration.md), the test inventory in [Testing](./testing.md),
the container specifics in [Deployment and operations](./deployment.md), and the
component map in [Architecture](./architecture.md).

## Prerequisites

- Node.js 24 or newer (CI uses Node.js 24, matching the bot Dockerfile).
- pnpm 12.23.0. The version is pinned in the `devEngines` field of the root `package.json`; CI currently pins 12.18.0.
- Git, required by Husky to install the hooks.

## Install dependencies

```sh
pnpm install
```

The root `prepare` script runs `husky`, which sets `git config core.hooksPath` to `.husky/_`.
Husky hook files are versioned in `.husky/` while the generated `.husky/_/` directory is ignored.
The workspace packages also run their own `prepare` scripts during install: `shared` builds
`dist/`, and `database` runs its `build` script (whose `prebuild` step runs
`prisma generate`). Neither script invokes a nested `pnpm i`, so installs are not recursive.

## Building the packages

`shared` and the bot compile with plain `tsc`, `database` compiles with
`tsc -p tsconfig.build.json`, and all three emit into a gitignored `dist/` directory;
the site uses `next build`:

```sh
pnpm -r build
```

The build order matters: the bot resolves `shared` through `shared/dist`. A fresh
`pnpm install` already runs the workspace `prepare` scripts, so `shared` is built and
`database` has run `prisma generate` plus `tsc`; if `shared/dist` is deleted manually,
rebuild it with `pnpm --filter shared build` (or `pnpm -r build`) before running
`typecheck`, `dev`, or `start`. `pnpm -r build` runs the packages in topological order
(shared and database before the bot and the site).

`database/tsconfig.build.json` sets `rootDir: "src"` and inherits `outDir: "dist"`,
so the build emits `dist/index.js` and `dist/index.d.ts`, which are exactly the paths
declared in `main`, `types`, and `exports`. Its script removes `dist/` first to avoid
stale files from earlier layouts. `shared` and the bot do not clean their output, so
remove stale files manually after renaming or deleting sources in those packages.

## Package distribution

Both publishable packages use a `files: ["dist"]` whitelist and a `prepack` build, so
their tarballs contain `dist/`, `package.json`, and the `LICENSE` that pnpm picks up
from the repository root:

| Package | `files` / `prepack` | What the tarball contains |
| --- | --- | --- |
| `shared` | `files: ["dist"]`, `prepack: pnpm run build` | `dist/` (including `dist/utils`) and `package.json`. |
| `database` | `files: ["dist"]`, `prepack: pnpm run build` | Flat `dist/` with `index.js`, `index.d.ts`, `env.*` and `setup.*`. |

`pnpm pack` runs `prepack` for both packages, so the archive contains a fresh, flat
build whose paths match `main`, `types`, and `exports`. The generated Prisma client is
not part of the tarball: consumers still need `prisma generate` against their own schema,
and the runtime reads `DATABASE_CONNECTION_STRING` (the Prisma CLI reads it through
`prisma.config.ts`). A packed `database` therefore ships the barrel and adapter exports,
not a ready-to-connect client.

Inspect an archive without publishing:

```sh
mkdir -p /tmp/veyra-packs
(cd shared && pnpm pack --pack-destination /tmp/veyra-packs)
(cd database && pnpm pack --pack-destination /tmp/veyra-packs)
tar -tzf /tmp/veyra-packs/shared-0.1.0.tgz
tar -tzf /tmp/veyra-packs/database-0.1.0.tgz
```

`pnpm-workspace.yaml` enables `injectWorkspacePackages`, so `pnpm deploy` and package
installation use the packed representation of workspace dependencies and therefore
respect `files` where a package defines it. During normal development pnpm may still
deduplicate workspace dependencies to symlinks; a symlinked package exposes its whole
workspace directory, which is expected and does not affect packed artifacts.

## Running the bot

- Watch mode from source: `pnpm --filter discord-bot dev` (the package name is
  `discord-bot`, the folder is `apps/discordBot`).
- Compiled output: `pnpm --filter discord-bot start`, which runs `node dist/main.js`
  and requires `pnpm -r build` first.

Both require `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` (create
`apps/discordBot/.env`; the variable names are documented in the root
`.env.example`); without them the process exits with a non-zero status right
after startup.

## Docker

A multi-service stack is defined in the root `docker-compose.yaml`:

- `db` — `postgres:18-alpine` with a persistent named volume mounted at
  `/var/lib/postgresql` (the PostgreSQL 18 image keeps `PGDATA` in a versioned
  subdirectory of that path) and a `pg_isready` healthcheck.
- `site` — the Next.js website built from `apps/site/Dockerfile`; the build context is
  the repository root, and the image runs `next start` from a `pnpm deploy --prod`
  output directory.
- `nginx` — reverse proxy built from `nginx/Dockerfile` (the config lives in
  `nginx/nginx.conf`). The active configuration listens on port 80, proxies `/` to
  `http://site:3000` (the `site` service name on the `veyra-net` compose network), and
  uses `$connection_upgrade` from the active `map` block. The HTTPS server is still
  commented out, so the mounted `ssl/` files are not read and the published port 443
  has no listener yet.
- `discord-bot` — bot runtime built from `apps/discordBot/Dockerfile` with
  `target: runtime`, containing the compiled `dist/` plus production dependencies
  (workspace `shared` and `database` included). Both application Dockerfiles copy the
  workspace sources, install with `--ignore-scripts`, then build `shared` and
  `database` before the application and restore the generated Prisma client after
  `pnpm deploy`; the site also needs `docs/brand-identity/tokens/tokens.css` and
  restores Turbopack's hashed externals. The site build needs no database URL:
  the Prisma singleton is created on first use at runtime. The bot has no
  healthcheck because it exposes no HTTP server.

### Preparing the stack

1. Copy `.env.example` to `.env` at the repository root. `POSTGRES_*` is interpolated
   by Compose into the db service (environment and healthcheck);
   `DATABASE_CONNECTION_STRING` and the OAuth client IDs/secrets are required by the
   `site` service; `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are passed through, and auth
   routes return 500 until a secret is supplied. `DISCORD_TOKEN`,
   `DISCORD_CLIENT_ID`, and `NODE_ENV` are injected into the bot container. With
   placeholder Discord credentials the bot logs the login error instead of crashing;
   the `unless-stopped` policy restarts it if the process exits.
2. Place the TLS certificate pair in `ssl/` (`fullchain.pem`, `privkey.pem`, mounted
   read-only at `/etc/nginx/ssl`); see `ssl/README.md` for a self-signed command for
   local testing. The active nginx config does not read these files because the HTTPS
   server block is commented out; they become required once that block is enabled.

### Stack commands

| Command | Description |
| --- | --- |
| `docker compose config` | Validates the merged compose file. |
| `docker compose build` | Builds the nginx, site, and discord-bot images. |
| `docker compose up -d` | Starts the stack; nginx waits for a healthy `site`. |
| `docker compose exec nginx nginx -t` | Tests the nginx configuration inside the running container. |
| `docker compose down` | Stops the stack; the named db volume is preserved. |

The previously documented blockers are fixed: both application images have the
`database` workspace manifest, nginx defines `$connection_upgrade`, and the bot's
impossible HTTP healthcheck was removed. The `SITE_API_URL` variable passed to the
bot container is not read by the bot code. HTTPS is still not enabled: port 443 is
published but has no listener until the commented server block is activated.

nginx resolves `proxy_pass` upstreams when the configuration is loaded, so `nginx -t`
succeeds only while a container resolvable as `site` exists on the compose network.
Inside a running stack `docker compose exec nginx nginx -t` is the reliable check; for
an isolated image test, attach a placeholder with
`docker run --rm -d --network veyra_veyra-net --network-alias site alpine:3 sleep 60`
first.

## Code documentation conventions

Comments and documentation are written in English. Every exported function,
class, interface, type and enum in the workspace and test sources has JSDoc that
describes real behavior, side effects, edge cases and error conditions; reusable
private helpers are documented the same way. Prisma models and enums use `///`
documentation comments. Inline comments are reserved for non-obvious algorithms,
workarounds, intentional oddities and architectural decisions — a comment that
only restates the code is noise. `.sql` migrations are excluded from this
convention. Keep comments and docs in sync with the code in the same change.

## Quality commands

| Command | Description |
| --- | --- |
| `pnpm run lint` | Runs ESLint over the repository. Prettier violations are reported as ESLint errors for TypeScript files. |
| `pnpm run format` | Rewrites supported files with Prettier. Files listed in `.prettierignore` are skipped. |
| `pnpm run typecheck` | Type-checks `apps/discordBot`, `shared`, `tests/` and `apps/site` with the `tsc` binary; `database` is compiled by its own build. |
| `pnpm run test` | Runs the Vitest suite once over the `tests/` directory. |
| `pnpm run test:watch` | Runs Vitest in watch mode. |
| `pnpm run test:coverage` | Runs Vitest once with V8 coverage. |

Lint, typecheck and tests all pass. The `prefers-reduced-motion` block in
`docs/brand-identity/tokens/tokens.css` uses `!important` deliberately; the
`css/no-important` rule is disabled in `eslint.config.mjs`.

## Tests

The Vitest suite lives in the root-level `tests/` directory, outside the workspace
packages so it is neither compiled by them nor auto-loaded by the bot's loader.

- Run everything with `pnpm run test`, or a single file with `pnpm exec vitest run <path>`.
- The loader tests exercise real fixture modules committed under
  `tests/apps/discordBot/core/fixtures/`; they are imported through `file://` URLs
  with a cache-busting query and transformed by Vitest/Vite, which strips the
  TypeScript types at load time.
- The entrypoint tests (`tests/apps/discordBot/main.test.ts`) replace every collaborator
  of `main.ts` with `vi.mock` (loader, Discord client, `ENV`, shutdown, shared logger)
  and re-import the module fresh in each test, because the whole boot sequence runs at
  import time. The mocked specifiers use the `.js` extension, which Vite maps onto the
  `.ts` sources; `process.exit` is mocked as a no-op so an unexpected exit cannot kill
  the Vitest worker, and the missing-credentials test overrides it with a throwing
  implementation to reproduce the real halting behavior.
- The test-only `resolve.alias` entries in `vitest.config.js` map `shared` to its
  TypeScript source (so the suite does not depend on the gitignored `shared/dist`
  build), `discord.js`, `dotenv`, and `@prisma/*` to the workspace packages that
  install them, React to the site's copy, and `next/font/google` to its build stub.
  The comments in the config explain each alias.
- `tests/tsconfig.json` uses the same `esnext`/`bundler` resolution and React type
  aliases as `apps/site`, plus the DOM library and `allowImportingTsExtensions`, so
  the site component tests typecheck cleanly. It serves both ESLint's type-aware
  `projectService` and the `tests/` leg of `pnpm run typecheck`.
- The shared-logger tests run against real winston transports pointed at a throwaway
  directory under `/tmp/opencode` and capture console output with stream spies; the
  Vitest worker is a separate process, so the temporary `chdir` stays local to that file.
- With `test:coverage`, fixture modules imported through `file://` URLs cannot be
  attributed reliably by the V8 remapper and show low or zero rows; the coverage of
  `apps/discordBot/src`, `shared/src/utils`, `database/src` (except the barrel), and
  the site TypeScript modules is the meaningful number. The same artifact applies to
  `shared/src/index.ts`, executed through the `shared` alias (see
  `tests/shared/index.test.ts`), and `database/src/index.ts`: both barrels contain
  only re-export statements, so no executable statements are attributed to them.
  `apps/site/src/app/globals.css` is also reported at `0%` because it is a
  stylesheet, not executable code.

## Git hooks

Husky installs two hooks:

- `pre-commit` runs `lint-staged`. Staged JavaScript/TypeScript files are fixed with ESLint and Prettier; staged JSON, JSONC, and CSS files are formatted with Prettier.
- `pre-push` runs `pnpm run typecheck` and then `pnpm run test`.

Bypass a hook only in emergencies with `git commit --no-verify` or `git push --no-verify`; CI will still run the same checks.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main` and on every pull request:

1. Checkout the repository.
2. Install pnpm 12.18.0 (the version pinned in `.github/workflows/ci.yml`; the repository pin and Docker images use 12.23.0) and Node.js 24 with the pnpm store cache.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Run `pnpm run lint`.
5. Run `pnpm run typecheck`.
6. Run `pnpm -r build`.
7. Run `pnpm run test`.

The `quality` job has a 10-minute timeout, read-only repository permissions, and cancels superseded runs on the same ref.

## TypeScript 6 and 7 side-by-side

TypeScript 7 does not expose the compiler API that typescript-eslint needs. The repository therefore follows the official side-by-side setup:

- `typescript` is aliased to `@typescript/typescript6`, which provides the TypeScript 6 API used by typescript-eslint. Its binary is `tsc6`.
- `@typescript/native` is an alias of TypeScript 7 and provides the `tsc` binary used by `pnpm run typecheck`.

Do not point `typescript` back to a TypeScript 7 release until typescript-eslint supports the TypeScript 7 API, otherwise ESLint exits before linting.

## Troubleshooting

- Hooks do not run: run `pnpm run prepare` and confirm that `git config core.hooksPath` returns `.husky/_`.
- ESLint reports `typescript-eslint does not support TS 7.0`: the dependency aliases described above are missing or the lockfile was changed; run `pnpm install`.
- Prettier skips a file: check the matching pattern in `.prettierignore` (for example `docs/`, `*.yml`, and `Dockerfile*` are intentionally excluded).
