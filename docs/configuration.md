# Configuration

This document lists every configuration input in the repository and where it is
read. Values below are placeholders: never commit real credentials, tokens, or
private configuration values.

## Toolchain versions

| Requirement | Source |
| --- | --- |
| Node.js 24 | CI workflow and both Dockerfiles use `node:24`; README documents 24+ |
| pnpm 12.23.0 | `devEngines.packageManager` in the root `package.json` and the global install in both Dockerfiles |

Use pnpm only; npm and yarn are not supported by the workspace configuration. The
`devEngines` entry uses `onFail: download`, so a mismatched local pnpm is replaced
automatically. The CI workflow currently pins pnpm 12.18.0, so CI installs a
different version from the repository pin and the Docker images; that mismatch
should be resolved in CI.

## Environment variables

The root [`.env.example`](../.env.example) is the template for the Docker Compose
stack. Copy it to a root `.env` before using Compose. There is no
`apps/discordBot/.env.example`; for local bot runs create `apps/discordBot/.env`
manually. The file in `docs/bot-standard/.env.example` is a template for catalog
bots, not for this repository's official bot.

| Variable | Consumer | Required | Purpose |
| --- | --- | --- | --- |
| `DISCORD_TOKEN` | `apps/discordBot/src/config/env.ts`; Compose passes it to the bot container | Yes, for the bot | Discord bot token used by `dsClient.login()`. The process exits with status 1 when it is missing. |
| `DISCORD_CLIENT_ID` | `apps/discordBot/src/config/env.ts`; `apps/site/src/lib/authConfig.ts` via `process.env`; Compose passes it to both containers | Yes, for the bot and Discord OAuth | Discord application id: checked for presence by the bot (no command registration consumes it there) and passed as the Discord OAuth client id by the site. |
| `NODE_ENV` | `apps/discordBot/src/config/env.ts` and `shared/src/utils/logger.ts`; Compose passes it to `site` and `discord-bot` | No | Defaults to `production`. Set to `development` to enable `debug` logging. Captured when the logger module is imported. |
| `DATABASE_CONNECTION_STRING` | `database/src/env.ts`, `database/prisma.config.ts`; Compose passes it to the `site` service | Yes, for database work and the `site` service | PostgreSQL connection string for the Prisma driver adapter and the Prisma CLI. The site image build sets no value: the lazy client defers configuration until the first database call, and Compose injects the real value at runtime. |
| `DISCORD_CLIENT_SECRET` | `apps/site/src/lib/authConfig.ts` via `process.env`; Compose passes it to `site` | Yes, for Discord OAuth | Discord OAuth client secret. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `apps/site/src/lib/authConfig.ts` via `process.env`; Compose passes them to `site` | Yes, for GitHub OAuth | GitHub OAuth application credentials. No aliases are needed. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `apps/site/src/lib/authConfig.ts` via `process.env`; Compose passes them to `site` | Yes, for Google OAuth | Google OAuth credentials. |
| `NEXTAUTH_URL` | `apps/site/src/lib/authConfig.ts` via `process.env`; NextAuth; Compose passes it to `site` | Yes, for OAuth | Public base URL used to build callback URLs; its protocol also decides whether cookies are `Secure` (HTTP means non-`Secure` cookies). |
| `NEXTAUTH_SECRET` | `apps/site/src/lib/authConfig.ts` via `process.env`; NextAuth; Compose passes it to `site` | Yes, for auth routes | Secret used to sign session tokens. Compose passes an empty value by default, so `/api/auth/*` fails until a random value is supplied in the root `.env`. |
| `POSTGRES_USER` | `docker-compose.yaml` (`db` service and healthcheck) | No | Defaults to `root`. |
| `POSTGRES_PASSWORD` | `docker-compose.yaml` (`db` service) | Yes, for Compose | Interpolated from the root `.env`; Compose fails when it is undefined. |
| `POSTGRES_DB` | `docker-compose.yaml` (`db` service and healthcheck) | No | Defaults to `veyra-main`. |
| `SITE_API_URL` | `docker-compose.yaml` (`discord-bot` service) | No | Set to `http://site:3000`, but no application code reads it. |

### OAuth callback URLs to register

NextAuth derives the callback from `NEXTAUTH_URL`; the app never reads a
per-provider callback setting from the environment. Register these exact URLs:

| Provider | Where to register | Redirect / callback URL |
| --- | --- | --- |
| GitHub | OAuth App settings → Authorization callback URL | `<NEXTAUTH_URL>/api/auth/callback/github` |
| Google | Cloud console → Credentials → OAuth client → Authorized redirect URIs | `<NEXTAUTH_URL>/api/auth/callback/google` |
| Discord | Developer portal → OAuth2 → Redirects | `<NEXTAUTH_URL>/api/auth/callback/discord` |

The requested scopes are limited to identity and email: `read:user user:email`
(GitHub), `openid email profile` (Google) and `identify email` (Discord).
For a local HTTP run set `NEXTAUTH_URL=http://localhost:3000`; cookies are then
not marked `Secure`. Missing or invalid client credentials redirect the user to
`/signin?error=Configuration` instead of crashing the route.

A `.env` file based on the template looks like this (placeholders only):

```dotenv
DATABASE_CONNECTION_STRING=postgresql://<USER>:<PASSWORD>@db:5432/<DATABASE>
POSTGRES_USER=<USER>
POSTGRES_PASSWORD=<PASSWORD>
POSTGRES_DB=<DATABASE>
DISCORD_TOKEN=<DISCORD_BOT_TOKEN>
DISCORD_CLIENT_ID=<DISCORD_APPLICATION_ID>
DISCORD_CLIENT_SECRET=<DISCORD_OAUTH_SECRET>
GITHUB_CLIENT_ID=<GITHUB_OAUTH_CLIENT_ID>
GITHUB_CLIENT_SECRET=<GITHUB_OAUTH_SECRET>
GOOGLE_CLIENT_ID=<GOOGLE_OAUTH_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<GOOGLE_OAUTH_SECRET>
NEXTAUTH_URL=<PUBLIC_SITE_URL>
NEXTAUTH_SECRET=<RANDOM_SESSION_SECRET>
NODE_ENV=
```

### dotenv loading rules

There are three distinct loading paths; they are not interchangeable:

| Context | Call | File loaded |
| --- | --- | --- |
| Bot runtime | `dotenv.config()` in `apps/discordBot/src/config/env.ts` | `.env` in the process working directory — `apps/discordBot` when started with `pnpm --filter discord-bot` |
| Application runtime with the database package | `dotenv.config()` in `database/src/env.ts` | `.env` in the host process's working directory, not `database/.env` |
| Prisma CLI | `dotenv.config({ path: ".env" })` in `database/prisma.config.ts` | `database/.env`, because the package scripts run from `database/` |

`dotenv` does not read `.env.local` or `.env.production` in any of these paths. Each
`ENV` object is a snapshot taken at first import; later changes to `process.env` do
not update it.

## Database variables in detail

`database/prisma/schema.prisma` intentionally declares no datasource `url`. Prisma 7
reads it from `prisma.config.ts`, which sets `datasource.url` from
`DATABASE_CONNECTION_STRING`. At first use, `database/src/setup.ts` validates the
same variable and throws `DATABASE_URL not found in environment variables` when it
is missing or empty. That message is historical; the variable actually read is
`DATABASE_CONNECTION_STRING`. The live `process.env` value wins over the
`ENV` snapshot, which can be captured at build time.

The `database` barrel (`database/src/index.ts`) re-exports the `prisma` singleton
from `src/setup.ts`. Both the barrel and the site's NextAuth route can therefore be
imported without a connection string: the singleton is a proxy that constructs the
client only when a property is read at runtime.

## Workspace and package configuration

`pnpm-workspace.yaml` includes `apps/*`, `shared`, and `database`, sets
`injectWorkspacePackages: true`, allows build scripts for `@prisma/engines`, `argon2`,
`esbuild`, and `prisma`, and declares two security overrides: `effect@3.22.1` (Prisma's transitive
pin is affected by GHSA-7589-6fvf-x4pw) and `minimatch@11.0.1` (GHSA-g3hv-75wg-m249 in
the ESLint toolchain). Both are applied through pnpm 12's `overrides` field in this
file; the older `pnpm.overrides` field in `package.json` is ignored by pnpm 12.

| File | Effect |
| --- | --- |
| `package.json` (root) | Workspace scripts: `lint`, `format`, `typecheck`, `test`, `test:watch`, `test:coverage`, `docker:*`, and `clear:*`; `prepare` installs Husky hooks |
| `apps/discordBot/package.json` | `dev` (tsx watch), `start` (`node dist/main.js`), `build` (tsc), `docker:build`, `docker:start`; declares `shared` and `database` as workspace dependencies |
| `apps/site/package.json` | `dev`, `build`, `start` (Next.js); declares `next-auth`, `@auth/prisma-adapter`, `argon2` and the `database`/`shared` workspace packages |
| `shared/package.json` | `dist/index.js` entry point with an `exports` map, `files: ["dist"]`, `build`, `prepack`, `prepare: pnpm run build` |
| `database/package.json` | `dist/index.js` entry point with an `exports` map, `files: ["dist"]`, Prisma scripts (`generate`, `push`, `migrate`, `studio`, `format`, `prebuild`), `build` (clears `dist`, then `tsc -p tsconfig.build.json`), `prepack`, `prepare: pnpm run build` |

## TypeScript configuration

`tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `isolatedModules`,
and `noFallthroughCasesInSwitch`. Each package overrides module settings:

| Config | Module / resolution | Notable options |
| --- | --- | --- |
| `apps/discordBot/tsconfig.json` | `nodenext` / `nodenext` | Emits to `dist`, `rootDir: src`, incremental |
| `shared/tsconfig.json` | `nodenext` / `nodenext` | Emits declarations to `dist`, incremental |
| `database/tsconfig.json` | `nodenext` / `nodenext` | Declarations, `outDir: dist`, includes `src/` and `prisma.config.ts` (editor/CLI use) |
| `database/tsconfig.build.json` | inherits | `rootDir: src`, `include: ["src/"]`; the `build` script uses it to emit a flat `dist/` |
| `apps/site/tsconfig.json` | `esnext` / `bundler` | `noEmit`, `jsx: react-jsx`, `@/*` path alias to `./src/*` |
| `tests/tsconfig.json` | `esnext` / `bundler` | `noEmit`, `jsx: react-jsx`, DOM lib, `allowImportingTsExtensions`, type aliases for test-only dependencies |

There are no path aliases in application code. The `@/*` alias exists only in the
site package. The aliases in `vitest.config.js` exist only for the root-level test
suite; see [Testing](./testing.md#resolution-aliases).

Do not add `"type": "module"` to `apps/discordBot/package.json`: the app runs as
CommonJS so that `loader.ts` can use `__dirname`. The root package is ESM.

## Linting and formatting

`eslint.config.mjs` applies JavaScript and TypeScript recommended rules, JSON and
CSS language plugins, and enforces Prettier as an ESLint error for TypeScript files
(`prettier/prettier`). It ignores dependency installs, build output, coverage, logs,
and Next.js working directories. `.prettierrc` holds the Prettier options, and
`.prettierignore` excludes generated files, lock-related paths, `Dockerfile*`, YAML,
SQL, and the entire `docs/` directory.

TypeScript uses the official side-by-side setup: `typescript` is aliased to
`@typescript/typescript6` (the API consumed by typescript-eslint), while
`@typescript/native` provides the TypeScript 7 `tsc` binary used by
`pnpm run typecheck`. Do not repoint `typescript` to version 7 until
typescript-eslint supports its API.

## Automation configuration

| File | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | On pushes to `main` and pull requests: install with `--frozen-lockfile`, then lint, typecheck, `pnpm -r build`, and test; 10-minute timeout, read-only permissions, concurrency cancellation |
| `.husky/pre-commit` | Runs `pnpm exec lint-staged` |
| `.husky/pre-push` | Runs `pnpm run typecheck` and `pnpm run test` |
| `lint-staged` in root `package.json` | ESLint + Prettier for JS/TS; Prettier for JSON/JSONC/CSS staged files |

## Container configuration

`docker-compose.yaml` interpolates the root `.env` into the `db`, `site`, and
`discord-bot` services, mounts `./ssl` read-only into `nginx`, and attaches all
services to the `veyra-net` network. `nginx/Dockerfile` copies `nginx/nginx.conf`
into the image. The application Dockerfiles are documented in
[Deployment and operations](./deployment.md).

## Related documents

- [Getting started](./getting-started.md)
- [Development workflow](./development.md)
- [Deployment and operations](./deployment.md)
- [Documentation index](./README.md)
