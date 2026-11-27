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
  `await registerCommands()`, then `await dsClient.login(ENV.token)`, then logs the
  logged-in username. Any thrown error is logged as `Bot initialization error: ...`
  and swallowed; a failed REST registration logs its own error and does not block
  login because `registerCommands()` resolves to `false` instead of throwing.
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
  source text. The dispatcher still evaluates the original predicate stored on
  the handler, so these modules are reachable at runtime.
- The `messageCommands` counter exists but is never incremented by any loader.

### `src/core/dispatcher.ts` — `dispatchInteraction()`

```ts
export async function dispatchInteraction(interaction: Interaction): Promise<void>;
```

Routes one `interactionCreate` payload to the loaded handler. Slash commands are
looked up by `commandName`; buttons, select menus and modals by `customId`, first
as a static collection key and then by evaluating any predicate found as a key
or on the handler object. Other interaction types are ignored. A missing handler
produces a `No ... handler registered for: ...` warning; a rejected handler is
logged as `Interaction handler failed: ...` and never propagated to the event
listener. The dispatcher depends on the registries on `dsClient`, so it must run
after `LoadAll()`.

### `src/core/registerCommands.ts` — `registerCommands()`

```ts
export async function registerCommands(): Promise<boolean>;
```

Builds the JSON of every loaded command with `data.toJSON()` and calls
`REST.put(Routes.applicationCommands(ENV.clientId), { body })` using
`ENV.token`. The full global command set is replaced, so removed commands are
also cleaned up. Returns `true` on success; missing credentials or a rejected
REST call are logged through the shared logger and return `false`. No new
dependency is needed: `REST` and `Routes` come from the existing `discord.js`.

### `src/events/interactionCreate.ts`

A default-exported `Event` module named `interactionCreate`. The loader discovers
it in `src/events` and subscribes its `execute` with `client.on`. It checks the
gateway argument structurally and forwards it to `dispatchInteraction`; it does
not implement any interaction logic itself.

### `src/core/shutdown.ts` — `shutdown()`

```ts
export async function shutdown(): Promise<void>;
```

Calls `await dsClient.destroy()` and logs `Client successfully destroyed`. It never
rejects: a destroy failure is logged as `Bot shutdown error: ...`. `main.ts` calls it
for missing credentials and on both termination signals, but not for boot
initialization errors.

### `src/types/interactions.ts` — interaction contracts

These interfaces describe the shape each loader accepts. `execute` is awaited by
`dispatchInteraction`; the loader itself does not invoke handlers except for events,
which are subscribed directly.

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
export { prisma } from "./setup";
```

The barrel re-exports the full generated client surface, including `PrismaClient`,
the `Prisma` namespace, and generated enums, plus the lazily initialized `prisma`
singleton. Importing it does not read environment variables or construct a client:
the singleton resolves those on first use. A generated Prisma client must exist
(`pnpm --filter database generate`) before this module can be imported.

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

A proxy around a Prisma client that is constructed on first property access from a
`PrismaPg` adapter and the live `DATABASE_CONNECTION_STRING` (falling back to
`ENV.databaseUrl`). It throws `DATABASE_URL not found in environment variables`
when the value is missing or empty, but only on first use, so importing the barrel
is side-effect free. The message keeps a historical name even though the variable
actually read is `DATABASE_CONNECTION_STRING`. The package `exports` map exposes
only the root entry, so this singleton is reachable through the barrel, not a
`database/src/setup` subpath; the site auth and registration code imports it from
the barrel.

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

Client component rendering the placeholder landing page at `/`. It shows one
`Sign In` button that calls `useRouter().push(ROUTES.signIn)` on click; `redirect`
is not used because it would run during render. The catalog described in the root
README is not implemented.

### `src/app/signin/page.tsx` and `src/app/register/page.tsx`

```tsx
export const metadata: Metadata;
export default function SignInPage();
export default function RegisterPage();
```

Server components that own browser metadata and mount the corresponding client
form. `/signin` matches `pages.signIn` and `pages.error` in `lib/authConfig.ts`;
`/register` follows the same convention because NextAuth has no registration page
setting. The sign-in page wraps the form in `<Suspense>` because the client form
reads `?error=` with `useSearchParams`; neither page implements authentication
itself. The sign-in form calls `signIn` from `next-auth/react` for both credentials
and OAuth, and the registration form posts to `/api/auth/register`.

### `src/app/signout/page.tsx` and `src/app/account/page.tsx`

Server components mounting the client controls `SignOutForm` and
`AccountProviders` inside `AuthShell`. `/signout` is the page configured as
`pages.signOut`; its button calls `signOut({ callbackUrl: "/", redirect: true })`
and exposes a locked state plus an error alert if the POST fails. `/account`
manages the OAuth identities linked to the current user: it fetches the list from
`/api/account/providers` on mount and offers an unlink button per registered
provider. Neither page reads session data during server rendering.

### `src/services/accountProviders.ts`

```ts
export type UnlinkOutcome =
  | "unlinked"
  | "invalid-provider"
  | "not-linked"
  | "unknown-user"
  | "last-sign-in-method";
export async function listLinkedProviders(userId: string): Promise<OAuthProviderId[]>;
export async function unlinkProvider(userId: string, provider: string): Promise<UnlinkOutcome>;
```

`listLinkedProviders` filters `Account.provider` values through `isOAuthProviderId`
and returns them in the order used by the sign-in screen, ignoring ids from an old
configuration. `unlinkProvider` rejects unregistered ids before any query, checks
that the user row and the link exist, and refuses to remove the last sign-in
method of a passwordless user. Deletion uses `deleteMany` on `(userId, provider)`;
a zero count is reported as `not-linked`. `User.discordId` is intentionally left
untouched because other models reference it.

### `src/app/api/account/providers/route.ts`

```ts
export async function GET(req: NextRequest): Promise<NextResponse>;
export async function DELETE(req: NextRequest): Promise<NextResponse>;
```

Both handlers identify the user from `getToken({ req, secret, secureCookie })`, so
the id comes from the signed JWT rather than the request. Missing `NEXTAUTH_SECRET`
returns 500, no session returns 401. `DELETE` validates a `{ provider }` body and
maps the service outcomes to 200 (with the remaining providers), 400, 404, 409 and
401; unexpected failures are logged and return 500.

### `src/components/authShell.tsx`, `formField.tsx`, `signInForm.tsx`, `registerForm.tsx`

`AuthShell` supplies the skip link, `<main>` landmark, single `<h1>` and footer
cross-link. `FormField` renders a labelled input with password reveal, help/error
text and the required ARIA wiring. The two form components hold client-side state,
validate on blur/submit and expose loading, error and success states. `signInForm.tsx`
also renders one labelled button per entry in `OAUTH_PROVIDER_OPTIONS`, with inline
brand SVG icons, a spinner and a disabled state shared with the credentials form.
`auth.module.css` is imported into `globals.css` together with
`docs/brand-identity/tokens/tokens.css` and uses `--vy-*` tokens for colors,
spacing, typography, radius, motion and elevation; a few literal values remain for
border widths and font weights.

### `src/lib/oauth.ts`, `authError.ts`, `authUser.ts`

`OAUTH_PROVIDER_IDS`, `OAuthProviderId` and `OAUTH_PROVIDER_OPTIONS` are the single
source of truth for the three provider buttons; `isOAuthProviderId` is a type guard.
`readAuthErrorMessage` maps a NextAuth `?error=` code to a generic, non-leaking
message and `PROVIDER_FAILURE_MESSAGE` covers a rejected client-side redirect.
`completePlatformUser` derives the required `username` (email local part, or the
existing `user-<hex>` fallback) and mirrors the provider `image` into `avatarUrl`.

### `src/lib/authConfig.ts`, `src/services/authAdapter.ts`

```ts
export interface AuthEnvironment { /* OAuth client ids/secrets, NEXTAUTH_* */ }
export type DiscordIdPersister = (userId: string, discordId: string) => Promise<boolean>;
export function buildAuthOptions(
  env: AuthEnvironment,
  adapter: Adapter,
  persistDiscordId: DiscordIdPersister,
): NextAuthOptions;
export function createAuthAdapter(base: Adapter): Adapter;
```

`buildAuthOptions` registers GitHub, Google, Discord and Credentials, sets JWT
sessions, maps `pages.signIn` and `pages.error` to `/signin` and `pages.signOut`
to `/signout`, and derives `Secure` cookies from `NEXTAUTH_URL`. It leaves `allowDangerousEmailAccountLinking`
disabled, so no account is taken over from an unverified email match. Its Discord
provider maps the profile id into `discordId`, and its `signIn` event passes that
id to `persistDiscordId` after every Discord sign-in (new, returning or explicitly
linked). The event logs a failed write through the shared logger instead of
throwing, so a valid OAuth login is not turned into an error redirect.
`createAuthAdapter` wraps only `createUser`, adding the platform columns and
forwarding `discordId` before delegating to the Prisma adapter.

### `src/services/auth.ts` and `src/services/hash.ts`

```ts
async function getUser(options: Prisma.UserWhereInput): Promise<User | null>;
async function createUser(inputData: {
  email: string;
  password: string;
  username?: string;
  avatarUrl?: string;
}): Promise<User>;
async function setUserDiscordId(userId: string, discordId: string): Promise<boolean>;
export { getUser, createUser, setUserDiscordId };

export async function createHash(password: string): Promise<string>;
export async function verifyHash(password: string, hashedPassword: string): Promise<boolean>;
```

`getUser` forwards a Prisma filter to `prisma.user.findFirst`. `createUser` hashes
the plaintext password with Argon2id and passes only `email`, `username` (a
`user-<hex>` fallback when omitted), `avatarUrl` (when supplied) and `passwordHash`
to `prisma.user.create`; the plaintext password is never persisted. `createHash`
uses Argon2id with `memoryCost: 19456`, `timeCost: 2` and `parallelism: 1`;
`verifyHash` delegates to `argon2.verify`. These parameters are fixed because
changing them would invalidate stored hashes. `setUserDiscordId` updates an
existing user row when `discordId` is null or different; it first checks that no
other row owns the id and uses `updateMany` so the write is a no-op when the id is
already correct, never creating a duplicate user. It returns `true` when the id is
stored (or already present) and logs a warning with both row ids before returning
`false` on a conflict, instead of skipping the write silently.

### `src/app/api/auth/[...nextauth]/route.ts`

Exports `GET` and `POST` from one `NextAuth(...)` handler. It wires
`createAuthAdapter(PrismaAdapter(prisma))`, passes `process.env` and
`setUserDiscordId` to `buildAuthOptions` and attaches the shared Winston logger.
Provider profiles, session policy, Discord id persistence and error routing are
defined in `lib/authConfig.ts`.

### `src/lib/routes.ts` and `src/lib/authForm.ts`

`ROUTES` centralises the frontend paths (`/signin`, `/signout`, `/register`,
`/api/auth/register`, `/`, `/account`, `/api/account/providers`); it mirrors the
NextAuth `pages` block defined in `lib/authConfig.ts` without importing the
server-only auth handler. `validateSignIn`, `validateRegister` and
`hasFieldErrors` implement client-side checks that match the registration
endpoint's limits (username 3–24, email format and 254-character cap, password
8–128) plus password confirmation. No extra password policy is defined.

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
