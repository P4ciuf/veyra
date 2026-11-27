# Getting started

This page takes a fresh checkout from installation to a running bot and website. It
focuses on commands that exist in the repository today. For the full workflow, see
[Development workflow](./development.md); for configuration details, see
[Configuration](./configuration.md).

## Prerequisites

- Node.js 24 or newer (CI and both Dockerfiles use Node 24).
- pnpm 12.23.0, pinned in the root `package.json` `devEngines` field. Use pnpm only.
- Git, needed by Husky to install the repository hooks.
- A Discord application with a bot token for running the official bot. The
  privileged `MessageContent` and `GuildMembers` intents must be enabled in the
  Discord developer portal, or login fails.

## Install

```sh
git clone https://github.com/P4ciuf/veyra.git
cd veyra
pnpm install
```

`pnpm install` runs the workspace `prepare` scripts: Husky installs the Git hooks,
`shared` compiles to `shared/dist`, and `database` runs `prisma generate` followed by
`tsc`. The bot resolves `shared` through that gitignored `dist` directory, so keep it
present. If you delete it, rebuild with `pnpm --filter shared build` or
`pnpm -r build`.

## Configure credentials

The bot reads `.env` from its working directory. Create `apps/discordBot/.env` with
the variable names from the root [`.env.example`](../.env.example):

```dotenv
DISCORD_TOKEN=<DISCORD_BOT_TOKEN>
DISCORD_CLIENT_ID=<DISCORD_APPLICATION_ID>
NODE_ENV=
```

`DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are mandatory: the process logs an error and
exits with status 1 if either is missing. Leave `NODE_ENV` empty to use `production`;
set it to `development` for debug logs. Never commit real credentials.

For the Docker Compose stack, copy `.env.example` to a root `.env` instead and fill
in the database and Discord variables; Compose needs that file even when only some
services are used. See [Deployment and operations](./deployment.md#compose-stack).

## Build

```sh
pnpm -r build
```

This builds `shared`, `database`, the bot, and the site in dependency order. The bot
build uses `tsc`; the site uses `next build`. `database` builds with
`tsconfig.build.json`, which emits a flat `dist/` matching its declared entry points,
and clears stale output first. A fresh `pnpm install` has already run the same builds,
so rebuilding is only necessary after changing sources or removing build output.

## Run

| Goal | Command |
| --- | --- |
| Bot in watch mode from source | `pnpm --filter discord-bot dev` |
| Compiled bot (requires a build) | `pnpm --filter discord-bot start` |
| Website in development mode | `pnpm --filter site dev` |
| Production website (requires a build) | `pnpm --filter site start` |

The package name is `discord-bot` but the folder is `apps/discordBot`. The bot's
`start` script runs `node dist/main.js`. On startup it logs in, auto-loads any
interaction modules found under `src/commands`, `src/events`, and
`src/handlers/{buttons,menus,modals}`, and logs a `Total loaded` summary. Those
directories do not exist in a fresh clone, so a warning for each missing path is
expected; see [Modules and API reference](./modules.md).

The website serves a placeholder landing page at `/` with a Sign In button, a JSON
health response at `/api/health`, and account screens at `/register` and `/signin`
backed by `/api/auth/register` and the NextAuth catch-all route. OAuth providers
need the credentials listed in [Configuration](./configuration.md); the catalog and
distribution features described in the root README are not implemented yet.

## Check the installation

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
```

`typecheck` covers the bot, `shared`, the root-level `tests/` directory, and `apps/site`
(the `database` package is compiled by its own build); lint covers the whole repository.
All three commands pass on a fresh checkout. The `!important` declarations in
`docs/brand-identity/tokens/tokens.css` are intentional and exempted by the ESLint
configuration. See [Testing](./testing.md) for the test inventory and coverage caveats.

## Next steps

- [Architecture](./architecture.md) — how the packages fit together.
- [Modules and API reference](./modules.md) — public exports and edge cases.
- [Data model and storage](./data-model.md) — Prisma models and migration.
- [Configuration](./configuration.md) — every variable and config file.
- [Testing](./testing.md) — suite layout and conventions.
- [Deployment and operations](./deployment.md) — images and Compose stack.
- [Documentation index](./README.md) — all documents in `docs/`.
