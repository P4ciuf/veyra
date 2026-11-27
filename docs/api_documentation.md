# Internal API notes: site authentication

This document is the team-facing API reference in place of a Swagger/OpenAPI
specification: no `api/docs/` spec exists in this repository, so the site's Next.js
App Router routes are documented here. It explains *why* the routes behave as they
do and *how* the pieces are wired, with placeholders for all values.

## Scope and endpoints

The site registers one NextAuth catch-all handler at
`apps/site/src/app/api/auth/[...nextauth]/route.ts`, exported as `GET` and `POST`.
The project-owned endpoints are:

| Route | Method | Behavior |
| --- | --- | --- |
| `/api/auth/signin/{provider}` | GET, POST | Starts the provider redirect; state and PKCE cookies are created by NextAuth |
| `/api/auth/callback/{provider}` | GET, POST | Verifies state/PKCE, exchanges the code, resolves the user and creates the session |
| `/api/auth/signin` | GET | Built-in provider selection page; the app's UI lives at `/signin` instead |
| `/api/auth/session` | GET | Returns the current session derived from the JWT cookie |
| `/api/auth/signout` | GET, POST | Clears the session cookie; the configured `/signout` target has no App Router page yet |
| `/api/auth/register` | POST | Email/password registration; rejects malformed JSON and non-object bodies with 400 |
| `/api/health` | GET | Dependency-free liveness probe returning `{ "ok": true }` for the compose healthcheck |

`{provider}` is `github`, `google` or `discord`. The credentials login posts to
`/api/auth/callback/credentials` through `next-auth/react` with `redirect: false`.

## Internal flow

1. `SignInForm` calls `signIn(provider, { callbackUrl: ROUTES.home })` where
   `ROUTES.home` is `/`, the same destination used after credentials login.
2. `buildAuthOptions()` in `src/lib/authConfig.ts` supplies the provider config:
   client credentials from the environment, scopes limited to identity and email,
    and a `profile()` mapper producing `{ id, name, email, image }`, plus `discordId`
    for Discord. Missing names or emails become `null` instead of throwing, so GitHub
    and Discord profiles without a public email can still complete.
 3. NextAuth redirects to the provider. On return it validates `state`/PKCE, then
    the callback handler looks up an `Account` by `(provider, providerAccountId)`.
4. First-time provider identities create a `User` row. `createAuthAdapter()` in
   `src/services/authAdapter.ts` adds the platform-only `username` (display name,
   email local part, or `user-<hex>`), mirrors `image` into `avatarUrl` and forwards
   the Discord `discordId` before delegating to the Prisma adapter. The provider
   identity is stored in `Account`. Returning users are found by
    `Account(provider, providerAccountId)` and reused: the `signIn` event in
    `buildAuthOptions` calls `setUserDiscordId()`, which writes the id only when it
    is missing or different. A conflict with another row is logged with both row
    ids and the write is skipped, and a database failure is logged without turning
    the successful OAuth exchange into an error redirect.
5. A JWT session cookie is written (`session.strategy: "jwt"`) and the browser is
   redirected to `/`. Database sessions are intentionally not used: NextAuth's
   Credentials provider cannot create one, so `strategy: "database"` would break
   the pre-existing email/password login.
6. Errors are redirected to `/signin?error=<code>` (`pages.error`). The client form
   reads the code with `useSearchParams()` inside a Suspense boundary and renders a
   generic message via `readAuthErrorMessage()`; raw codes, provider descriptions
   and stack traces are never displayed.

## Configuration

`NEXTAUTH_URL` is the public base URL and must be set for OAuth. Register the
following callback URLs in each console (GitHub OAuth App, Google Cloud Console
Credentials, Discord Developer Portal OAuth2):

| Provider | Callback URL |
| --- | --- |
| GitHub | `<NEXTAUTH_URL>/api/auth/callback/github` |
| Google | `<NEXTAUTH_URL>/api/auth/callback/google` |
| Discord | `<NEXTAUTH_URL>/api/auth/callback/discord` |

Client ids and secrets come only from `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID` and
`DISCORD_CLIENT_SECRET`. Missing values are passed as empty strings so NextAuth
returns `?error=Configuration`; no credential value is logged or rendered. See
[Configuration](./configuration.md#oauth-callback-urls-to-register).

## Account-linking decision

NextAuth's `allowDangerousEmailAccountLinking` is left at its safe default (`false`)
for all three providers. The decision, and why it satisfies the safety requirement:

- An email match alone **never** links an existing account to a new provider
  identity. Even if GitHub or Discord returns an email that belongs to an existing
  user, NextAuth throws `AccountNotLinkedError` and the UI shows a generic "not
  linked" message. This prevents account takeover from an unverified email.
- Google is the only provider that reports `email_verified`, but it is deliberately
  treated the same way: a single uniform rule avoids trusting provider-specific
  verification claims, and the safest existing behavior is to require explicit
  linking. This is a conscious restriction, not an oversight.
- A signed-in user can still link a provider explicitly: when a session already
  exists and the provider identity is new, NextAuth calls `adapter.linkAccount()`
  for the current user. This is the supported linking path.
- Returning provider users are recognised by `Account(provider,
  providerAccountId)`, not by email, so an email change at the provider does not
  affect the link.
- Discord sign-in stores the stable account id in `User.discordId` for both new and
  returning users. The column stays nullable for GitHub, Google and credentials
  users. A write that would collide with another row is skipped and logged with
  both row ids so the unique index never breaks a sign-in; the other user's row is
  never modified automatically. No auto-linking by email is performed.
- Historical users that already had a Discord `Account` row but no `discordId`
  value are covered by the backfill migration
  `20261127120000_backfill_discord_id_from_accounts`, which reads the stable id
  from `Account.providerAccountId`. Users without any Discord identity are filled
  on their next Discord sign-in.

## Error states

| NextAuth code | UI behavior |
| --- | --- |
| `OAuthAccountNotLinked` | Explains that the provider must be linked from an existing signed-in session |
| `AccessDenied` | Cancellation/denial, invites a retry |
| `OAuthCallback`, `Callback`, `OAuthSignin` | Generic provider failure |
| `Configuration` | Server configuration problem, no detail leaked |
| `OAuthCreateAccount`, `EmailCreateAccount`, `Verification` | Generic account/link failure |
| Unknown code | Generic fallback message |

Server-side diagnostics continue to go through the shared Winston logger attached
in the route handler.

### Registration request validation

`POST /api/auth/register` parses the body before destructuring it. A `SyntaxError`
from JSON parsing (malformed or empty body) and any parsed value that is not a
non-null, non-array object both return `400 { "error": "Invalid request body" }`.
This keeps a `null` body out of the field checks and out of the generic 500 path,
which is reserved for unexpected failures. The data-access service passes only
`email`, `username`, `avatarUrl` and the Argon2id `passwordHash` to Prisma: the
plaintext password is never part of the create payload.

| Status | Response | Condition |
| --- | --- | --- |
| `201` | `{ "message": "Account created successfully", "user": <row> }` | Valid body and no duplicate email |
| `400` | `{ "error": "Invalid request body" }` | Malformed JSON or a parsed value that is not a non-null, non-array object |
| `400` | `{ "error": "Invalid username" }` | Trimmed username outside 3–24 characters |
| `400` | `{ "error": "Invalid email" }` | Email longer than 254 characters or failing the shared pattern |
| `400` | `{ "error": "Password must be between 8 and 128 characters" }` | Password length outside 8–128 |
| `409` | `{ "error": "Email already registered" }` | Pre-check found the email, or the insert raised Prisma `P2002` |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure, logged through the shared logger |

The endpoint trims the username and lowercases the email before validation and
storage. The client-side checks in `src/lib/authForm.ts` mirror these limits.

## Examples

Start a provider flow from a browser/curl; a real flow needs the cookies set by
`/api/auth/csrf` and the provider's `state`, so it cannot be completed with a single
stateless request:

```bash
curl -i "http://localhost:3000/api/health"
curl -i "http://localhost:3000/api/auth/signin/github?callbackUrl=%2F"
curl -i "http://localhost:3000/api/auth/callback/github?code=<CODE>&state=<STATE>"
```

Inspect the resulting session and register an email/password account (existing flow):

```bash
curl -i "http://localhost:3000/api/auth/session"
curl -i -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"<USERNAME>","email":"<EMAIL>","password":"<PASSWORD>"}'
```

## Known limitations and open questions

- A live Discord OAuth login still cannot be verified without real provider credentials
  and a registered callback URL. The callback path is covered by
  `tests/apps/site/discord-login-flow.test.ts`, which drives the real NextAuth
  callback handler with an in-memory adapter, and the backfill SQL is checked on a
  disposable database; neither replaces a real provider round trip.
- There is no UI for reviewing or unlinking connected providers yet; linking requires
  initiating provider sign-in from an existing session.
- `emailVerified` stays `null` for OAuth users, including Google users whose provider
  email is verified.
- Open question: should verified-email linking be enabled later only for Google, and
  should a dedicated account-settings link flow replace the implicit one?

## Internal Changelog

- 2026-11-27 — Documented GitHub/Google/Discord OAuth flow, callback registration,
  adapter models, JWT-session rationale and the no-email-auto-link decision.
- 2026-11-27 — Documented the registration body guard (400 for `null`, arrays,
  scalars and malformed JSON) and the explicit Prisma create allowlist.
- 2026-11-27 — Added `/api/health` to the endpoint table and examples, and made
  this document the canonical API reference now that the repository has no
  Swagger/OpenAPI spec.
- 2026-11-27 — Corrected the stale claim that the Prisma client is built at import
  time; the barrel now exports a lazy proxy and the logger mocks it as a boundary.
- 2026-11-27 — Added the `POST /api/auth/register` response table with status codes,
  normalization rules and the mapping of Prisma `P2002` to `409`.
- 2026-11-27 — Documented Discord id persistence on first, returning and explicitly
  linked sign-ins, including the unique-id conflict guard.
- 2026-11-27 — Added the `Account`-based backfill migration for historical users,
  made conflict and write-failure logging explicit, and covered the real callback
  handler with an integration-style test.
