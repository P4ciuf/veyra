# Contributing and conventions

This document summarises the contribution workflow and the conventions that apply
to code in this repository. It is based on the root
[CONTRIBUTING.md](../CONTRIBUTING.md), the workspace manifests, the Husky hooks and
the CI workflow; those root files remain authoritative for the contribution policy.

## Two contribution paths

| Path | Where it happens | Rule |
| --- | --- | --- |
| Core applications and documentation | Fork, branch, pull request | Pull requests are the preferred way to change the bot, site, shared packages, database layer, tests and docs |
| Bot catalog | Website submission flow | Never add a catalog bot through a pull request; see [Adding Your Bot to the Veyra Catalog](./ADDING_BOTS.md) |

For large features or architectural changes, open an issue before starting work.
Use a descriptive branch name such as `fix/login-validation` or `feat/bot-settings`.
Keep each pull request focused, preserve existing behavior unless the change
intentionally alters it, add or update tests for changed behavior, and update the
affected documentation. Do not commit credentials, generated build output or local
configuration files.

Every catalog bot repository must contain a `veyra.json` manifest at its root,
defined by the [Veyra Bot Metadata Specification](./specifications/bot-metadata.md)
and the [JSON Schema](../schemas/bot-metadata.schema.json), alongside the files
required by the [Veyra Bot Standard](./bot-standard/VBS-SPECIFICATION.md).

## Reporting issues

For core-application bugs, use the issue tracker with a descriptive title, the
affected application, reproduction steps, expected and actual behavior, and error
messages or screenshots with private information removed. Security vulnerabilities
must be reported privately as described in [SECURITY.md](../SECURITY.md), never in
a public issue.

## Local conventions

- Use Node.js 24 and pnpm; do not use npm or yarn for repository commands. See
  [Getting started](./getting-started.md) for installation and the toolchain pin.
- Keep comments and documentation in English. Every exported function, class,
  interface, type, enum and reusable helper has JSDoc describing real behavior,
  side effects, edge cases and errors. Prisma models and enums use `///` comments.
  Inline comments explain non-obvious logic or intentional oddities only; `.sql`
  migrations are exempt.
- Use `logger` from `shared` instead of `console` in application code.
- Tests live in the root-level `tests/` directory, mirroring the workspace layout,
  so they stay out of package builds and the bot's dynamic loader. Follow the
  conventions in [Testing](./testing.md).
- There are no path aliases in bot or shared code: import `shared` by package name
  and use relative specifiers elsewhere. Only `apps/site` uses `@/*` through its
  own tsconfig.
- Do not add `"type": "module"` to `apps/discordBot/package.json`: the bot runs as
  CommonJS so `loader.ts` can use `__dirname`.
- Environment variables are documented with placeholders only. Never commit real
  tokens, client secrets, connection strings or private keys; see
  [Configuration](./configuration.md).

## Quality gates

Run the checks in this order before pushing; the same commands run in CI:

```sh
pnpm run lint
pnpm run typecheck
pnpm -r build
pnpm run test
```

Two Husky hooks automate part of this: `.husky/pre-commit` runs
`pnpm exec lint-staged` (ESLint and Prettier for JS/TS, Prettier for JSON/JSONC/CSS),
and `.husky/pre-push` runs `pnpm run typecheck` followed by `pnpm run test`. The CI
workflow in `.github/workflows/ci.yml` installs with `--frozen-lockfile` and then
runs lint, typecheck, `pnpm -r build` and the test suite on pushes to `main` and on
pull requests. Details are in [Development workflow](./development.md).

## Design system and docs

The design-system documents under [Brand identity](./brand-identity/README.md) are
target-state specifications; only the authentication screens currently consume the
`--vy-*` token stylesheet. Update the JSON token files and `tokens.css` together,
and keep `docs/` prose in English with working relative links.
