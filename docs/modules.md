# Modules and API reference

This document describes the public surface of every module in the repository: what
it exports, how to call it, and the edge cases that are visible from the code. It is
a reference for contributors working on the applications. The high-level picture is
in [Architecture](./architecture.md).

## Discord bot (`apps/discordBot`)

The package name is `discord-bot`; the directory is `apps/discordBot`. It runs as
CommonJS (its `package.json` has no `type` field), which allows `loader.ts` to use
`__dirname`.

### `src/main.ts` — entrypoint

The module has no exports. Its side effects run at import time:

- If `ENV.clientId` or `ENV.token` is falsy, it logs `Client ID or Token not found`,
  starts `shutdown()` without awaiting it, and calls `process.exit(1)`.
- Otherwise an async IIFE calls `await new Loaders().LoadAll()`, then
  `await dsClient.login(ENV.token)`, then logs the logged-in username. Any thrown
  error is logged as `Bot initialization error: ...` and swallowed.
- `SIGINT` logs the signal and awaits `shutdown()`.
- `SIGTERM` logs the signal, awaits `shutdown()`, and sets `process.exitCode = 1`.

### `src/config/env.ts` — `ENV`

```ts
export const ENV: {
  token: string | undefined;
  clientId: string | undefined;
  nodeEnv: string;
};
```

`dotenv.config()` runs at import time and loads `.env` from the process working
directory. `.env.local` and other variants are not read. `ENV` is a snapshot:
changes to `process.env` after the first import have no effect on it.

| Field | Source | Default |
| --- | --- | --- |
| `token` | `process.env.DISCORD_TOKEN` | `undefined` (fatal at startup when missing) |
| `clientId` | `process.env.DISCORD_CLIENT_ID` | `undefined` (fatal at startup when missing) |
| `nodeEnv` | `process.env.NODE_ENV` | `"production"` when unset or empty |

### `src/core/client.ts` — `dsClient`

```ts
export const dsClient: Client & {
  commands: Collection<string, Command>;
  buttons: Collection<string, Button>;
  modals: Collection<string, Modal>;
  menus: Collection<string, Menu>;
};
```

A single `discord.js` `Client` created with five gateway intents: `Guilds`,
`MessageContent`, `GuildMembers`, `GuildMessages`, and `DirectMessages`.
`MessageContent` and `GuildMembers` are privileged and must be enabled in the Discord
developer portal or login fails; the other three are ordinary intents. The four empty `Collection` instances are attached to the same object so
every importer sees the same registries.

Keys used by the loader:

| Collection | Key |
| --- | --- |
| `commands` | `command.data.name` |
| `buttons` | `button.customId` as-is |
| `modals` | `modal.customId` as-is, or the predicate's `toString()` when it is a function |
| `menus` | `menu.customId`, or the function name when it is a function (`"dynamic"` when anonymous) |

### `src/core/loader.ts` — `Loaders`

```ts
export class Loaders {
  public async LoadAll(): Promise<void>;
}
```

Recursively imports interaction modules and registers them on `dsClient`. `LoadAll`
processes five categories in this order: buttons, commands, events, menus, modals,
then logs a single `✓ Total loaded: ...` summary. Missing directories produce a
`Path does not exist: ...` warning and do not abort the run.

Source directories are resolved relative to `loader.ts` itself, so they work both
from source (`tsx`) and from compiled output:

| Category | Directory |
| --- | --- |
| Buttons | `src/handlers/buttons` |
| Commands | `src/commands` |
| Events | `src/events` |
| Menus | `src/handlers/menus` |
| Modals | `src/handlers/modals` |

Only files whose names end in `.ts` or `.js` are imported; subdirectories are
traversed depth-first, and other files (for example `README.txt`) are ignored.

Module unwrapping, in order: a `default` export is used; if that default has its own
`default`, the inner value is used; otherwise one of the named exports `command`,
`event`, `button`, `modal`, or `menu` is used; failing that the whole module object is
returned and validated by the loader. Imports use a `file://` URL with a
`?update=<timestamp>` query so each call produces a fresh module instance instead of
a cached one. An import error is logged and rethrown; each individual loader catches
it and returns a count of `0`.

Validation rules:

| Loader | Required shape | Behavior on failure |
| --- | --- | --- |
| Button | `customId` truthy, `execute` is a function | `Button not loaded from ...` warning, skipped |
| Command | `data` truthy, `execute` is a function | `Command not loaded from ...` warning, skipped |
| Event | `name` truthy, `execute` is a function | `Event not loaded from ...` warning, skipped |
| Menu | `customId` truthy, `execute` is a function | `Menu not loaded from ...` warning, skipped |
| Modal | `customId` truthy, `execute` is a function | `Modal not loaded from ...` warning, skipped |

Additional details worth knowing when writing a module:

- The button loader skips any path containing the substring `events`, a defensive
  guard against a future shared scanner registering an event as a button.
- Events with `once: true` use `client.once`; all others use `client.on`. Every
  gateway argument is forwarded unchanged to `execute`.
- A function-valued menu `customId` is keyed by `Function.name` (or `"dynamic"` for
  an anonymous function); a function-valued modal `customId` is keyed by its full
  source text. Dynamic matching against a live interaction is not implemented.
- The `messageCommands` counter exists but is never incremented by any loader.

### `src/core/shutdown.ts` — `shutdown()`

```ts
export async function shutdown(): Promise<void>;
```

Calls `await dsClient.destroy()` and logs `Client successfully destroyed`. It never
rejects: a destroy failure is logged as `Bot shutdown error: ...`. `main.ts` calls it
for missing credentials and on both termination signals, but not for boot
initialization errors.

### `src/types/interactions.ts` — interaction contracts

These interfaces describe the shape each loader accepts. `execute` is awaited by a
future dispatcher where noted; the loader itself does not invoke handlers except for
events, which are subscribed directly.

```ts
interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface Button {
  customId: string | ((id: string) => boolean);
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

interface Event {
  name: string;
  once?: boolean;
  execute: (...args: unknown[]) => Promise<void> | void;
}

interface Menu {
  customId: string;
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}

type Modal = {
  customId: string | ((id: string) => boolean);
  execute: (interaction: ModalSubmitInteraction) => void;
};
```

Two runtime deviations are intentional and visible in the loader: a function
`customId` is accepted for menus even though `Menu` declares only `string`, and a
`Modal`'s `execute` is synchronous while the other handlers are asynchronous.

## Shared package (`shared`)

`shared/src/index.ts` exports exactly one symbol:

```ts
export { logger } from "./utils/logger";
```

The package uses `dist/index.js` as its entry point, so consumers write
`import { logger } from "shared"`. There are no path aliases in application code.

### `logger`

```ts
logger.error(message: string, meta?: unknown): void;
logger.warn(message: string, meta?: unknown): void;
logger.info(message: string, meta?: unknown): void;
logger.debug(message: string, meta?: unknown): void;
```

A facade over a single Winston logger. `meta` is appended to the formatted line as
JSON when present.

| Method | Console | Rotating file `logs/app-<date>.log` |
| --- | --- | --- |
| `error` | Yes | Yes |
| `warn` | Yes | Yes |
| `info` | Yes (`info` threshold) | No |
| `debug` | Only when `NODE_ENV=development` at import time | No |

The log directory is `<process cwd>/logs` and is created eagerly. Files rotate daily
with a seven-day retention policy. The console formatter colours an entire line by
severity; the file formatter uses the same layout without ANSI escapes. `NODE_ENV` is
captured when the module is imported — changing it later has no effect.

Do not use `console` in application code; use this facade.

## Database package (`database`)

### `src/index.ts` — package barrel

```ts
export * from "@prisma/client";
export { PrismaPg } from "@prisma/adapter-pg";
```

The barrel re-exports the full generated client surface, including `PrismaClient`,
the `Prisma` namespace, and generated enums. It does **not** export the `prisma`
singleton, and importing the barrel does not read environment variables or construct
a client. A generated Prisma client must exist (`pnpm --filter database generate`)
before this module can be imported.

### `src/env.ts` — `ENV`

```ts
export const ENV: { databaseUrl: string | undefined };
```

A snapshot of `process.env.DATABASE_CONNECTION_STRING`, loaded with `dotenv.config()`
from the process working directory at import time. This is distinct from how the
Prisma CLI loads `database/.env` (see [Configuration](./configuration.md#database-variables-in-detail)).

### `src/setup.ts` — `prisma`

```ts
export const prisma: PrismaClient;
```

Constructed at import time from a `PrismaPg` adapter using `ENV.databaseUrl`. Throws
`DATABASE_URL not found in environment variables` when the value is missing or empty;
the message keeps a historical name even though the variable actually read is
`DATABASE_CONNECTION_STRING`. The package `exports` map exposes only the root entry,
so this singleton is not reachable through a `database/src/setup` subpath; no
application imports it today.

### `prisma.config.ts`

Default-exports a `defineConfig` object with `schema: "prisma"`, migrations at
`prisma/migrations`, and `datasource.url` from `process.env.DATABASE_CONNECTION_STRING`.
It calls `dotenv.config({ path: ".env" })`, which resolves to `database/.env` when the
package scripts run with `database/` as the working directory.

## Website (`apps/site`)

### `src/app/layout.tsx`

```tsx
export const metadata: Metadata;
export default function RootLayout({ children }: { children: React.ReactNode });
```

Exports browser metadata with title `Veyra` and a public description. `RootLayout`
renders the `<html lang="en">` shell, mounts the `Geist` and `Geist_Mono` CSS
variables, imports `./globals.css`, and gives `<body>` a full-height flex-column
layout. Tailwind's `font-sans` / `font-mono` utilities are not yet mapped to those
font variables.

### `src/app/page.tsx`

```tsx
export default function Home();
```

Renders the placeholder landing page at `/`. Its only content is an `<h1>` reading
`Hello World`; the catalog described in the root README is not implemented.

### `src/app/api/health/route.ts`

```ts
export function GET(): Response;
```

Returns `Response.json({ ok: true })` with status 200. The handler has no
dependencies and is consumed by the `site` healthcheck in `docker-compose.yaml`.

### `next.config.ts`

Default-exports a `NextConfig` object with `cacheComponents: true`,
`partialPrefetching: true`, and a Turbopack rule mapping `*.css` to the
`@tailwindcss/turbopack` loader. Tailwind is configured as a Turbopack rule rather
than a PostCSS plugin because Turbopack is enabled.

## Related documents

- [Architecture](./architecture.md)
- [Data model and storage](./data-model.md)
- [Configuration](./configuration.md)
- [Testing](./testing.md)
- [Documentation index](./README.md)
