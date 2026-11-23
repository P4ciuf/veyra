# Deployment and operations

This document describes the container images and the Docker Compose stack defined in
the repository, including the configuration they require and the remaining limitations.
The development-side view of the same setup is in
[Development workflow](./development.md#docker).

## Images

### Discord bot

`apps/discordBot/Dockerfile` is a two-stage image:

1. `build` (`node:24-alpine`) installs pnpm 12.18.0 globally, copies the root
   manifests plus the `apps/discordBot`, `shared` and `database` manifests, and runs
   `pnpm install --frozen-lockfile --filter discord-bot... --ignore-scripts`. It then
   copies the three `src/` trees plus `database/prisma` and `prisma.config.ts`, runs
   `pnpm --filter discord-bot... run build` (topological order: `shared` and `database`
   before the bot), and deploys production dependencies with
   `pnpm --filter discord-bot --prod deploy /out`. Lifecycle scripts are skipped at
   install time because they need the sources copied in the next layer.
2. `runtime` (`node:24-alpine`) sets `NODE_ENV=production`, copies `/out` into
   `/app`, and starts `node dist/main.js`. No `.env` file is baked into the image.

Build context is the repository root. The package scripts expose:

| Command | Effect |
| --- | --- |
| `pnpm --filter discord-bot docker:build` | Builds the image as `veyra-discord-bot` from the repo root |
| `pnpm --filter discord-bot docker:start` | Runs it detached as `veyra-discord-bot` with `--env-file .env` |

The standalone `docker:start` expects an `.env` file in `apps/discordBot` because
that is the directory from which the filter runs the script.

### Website

`apps/site/Dockerfile` follows the same pattern: `node:24-alpine` build stage, the
root and `apps/site` manifests plus `database/package.json`,
`pnpm install --frozen-lockfile --filter site --ignore-scripts`,
`pnpm --filter site run build`, `pnpm --filter site --prod deploy /out`; the runtime stage starts
`node_modules/.bin/next start` through the binary created by `pnpm deploy`. The
build context is the repository root.

### Reverse proxy

`nginx/Dockerfile` is based on `nginx:1.30-alpine` and copies `nginx/nginx.conf` to
`/etc/nginx/conf.d/default.conf`. It exposes ports 80 and 443. The compose build
context for this image is `./nginx`, not the repository root.

## Compose stack

`docker-compose.yaml` defines a `veyra-net` bridge network and a named volume
`veyra_db`.

| Service | Image / build | Environment | Healthcheck |
| --- | --- | --- | --- |
| `db` | `postgres:18-alpine` | `POSTGRES_USER` (default `root`), `POSTGRES_PASSWORD` (required), `POSTGRES_DB` (default `veyra-main`) | `pg_isready` every 5s |
| `site` | `apps/site/Dockerfile`, root context | `DATABASE_CONNECTION_STRING` (required), `NODE_ENV` (default `production`), `HOSTNAME=0.0.0.0` | `wget -qO- http://127.0.0.1:3000/api/health` every 10s |
| `nginx` | `nginx/Dockerfile`, `./nginx` context | None | None |
| `discord-bot` | `apps/discordBot/Dockerfile`, root context, `target: runtime` | `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` (both required), `SITE_API_URL=http://site:3000`, `NODE_ENV` (default `production`) | None (no HTTP server) |

All services use `restart: unless-stopped`. The `site` service waits for `db` to be
healthy; `nginx` and `discord-bot` wait for `site` to be healthy. Only nginx publishes
host ports (`80:80` and `443:443`).

Root-level stack scripts:

| Command | Effect |
| --- | --- |
| `pnpm run docker:up` | `docker compose up --build` |
| `pnpm run docker:down` | `docker compose down` (the named volume is preserved) |
| `pnpm run docker:build` | `docker compose build` |
| `pnpm run docker:recreate` | Down, `build --no-cache`, then `up -d` |

`SITE_API_URL` is passed to the bot container but is not read by any application
code. See [Configuration](./configuration.md#environment-variables) for every
variable and placeholder examples.

## Reverse proxy configuration

The active `server` block in `nginx/nginx.conf` listens on port 80 as the default
server and proxies `/` to `http://site:3000`. The `map` that defines
`$connection_upgrade` is active so WebSocket upgrades are forwarded correctly; the
HTTPS server block is still commented out, and port 443 is published by Compose but
has no listener.

The `ssl/` directory is mounted read-only at `/etc/nginx/ssl` and is expected to
contain `fullchain.pem` and `privkey.pem` once HTTPS is enabled; both files are
gitignored. `ssl/README.md` documents a self-signed command for local testing and a
real CA for deployment.

## Resolved blockers and remaining limitations

Three defects that previously prevented the stack from running were fixed:

1. **Application image builds.** Both Dockerfiles now copy `database/package.json`,
   so the `database: workspace:*` dependency declared by the bot and the site resolves
   during the frozen-lockfile install.
2. **nginx startup.** The `$connection_upgrade` map is active, so the active server no
   longer references an undefined variable.
3. **Bot health.** The impossible HTTP probe on port 3001 was removed; the bot has no
   HTTP server, so no health status is reported for that service.

Remaining limitations: HTTPS is not enabled (port 443 has no listener and the `ssl/`
files are not read), `SITE_API_URL` is not consumed by the bot, and `nginx -t` resolves
upstreams at configuration load time, so it succeeds only while a container resolvable
as `site` exists on the compose network. `docker compose exec nginx nginx -t` inside a
running stack is the reliable check.

## Operational notes

- No application secret is stored in the repository. Supply credentials through the
  root `.env` for Compose or through `apps/discordBot/.env` for standalone runs; use
  placeholders in documentation and examples.
- Logs written by the bot's shared logger go to `logs/app-<date>.log` under the
  process working directory, not to stdout alone. The compose bot service does not
  mount a log volume, so those files live inside the container filesystem.
- Database schema changes are managed with the `database` package scripts;
  apply the committed migration before expecting the models to exist. See
  [Data model and storage](./data-model.md).

## Related documents

- [Development workflow](./development.md#docker)
- [Configuration](./configuration.md#container-configuration)
- [Architecture](./architecture.md#deployment-topology)
- [Documentation index](./README.md)
