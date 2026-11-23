# Veyra documentation

Index of the main documents in this directory. The design-system sub-documents are
indexed from [Brand identity and design system](./brand-identity/README.md). The product
vision and feature plan are in the root [README.md](../README.md); the phased development
plan is in [ROADMAP.md](../ROADMAP.md).

## Start here

| Document | Content |
| --- | --- |
| [Getting started](./getting-started.md) | Prerequisites, install, credentials, build, run, and a first verification |
| [Architecture](./architecture.md) | Workspace packages, component map, runtime flows, and current implementation status |

## Reference

| Document | Content |
| --- | --- |
| [Modules and API reference](./modules.md) | Public exports, signatures, registration keys, and edge cases for the bot, shared logger, database package, and site |
| [Data model and storage](./data-model.md) | Prisma models, enums, relations, migration, and known gaps |
| [Configuration](./configuration.md) | Environment variables, dotenv rules, TypeScript/ESLint/Vitest config, and automation files |

## Development and operations

| Document | Content |
| --- | --- |
| [Development workflow](./development.md) | Local setup, package builds and distribution, bot run commands, Docker, quality commands, Git hooks, CI, and the TypeScript 6/7 setup |
| [Testing](./testing.md) | Test inventory, commands, mocking conventions, resolution aliases, and coverage caveats |
| [Deployment and operations](./deployment.md) | Container images, Compose stack, nginx proxy, required variables, and known blockers |

## For bot authors

| Document | Content |
| --- | --- |
| [Veyra Bot Metadata Specification](./specifications/bot-metadata.md) | Official `veyra.json` contract: fields, categories, versioning, licensing, validation, and submission integration |
| [bot-metadata.schema.json](../schemas/bot-metadata.schema.json) | Official JSON Schema Draft 2020-12 used to validate `veyra.json` |
| [Adding Your Bot to the Veyra Catalog](./ADDING_BOTS.md) | How to submit a bot to the Veyra catalog through the official website |
| [Veyra Bot Standard (VBS)](./bot-standard/VBS-SPECIFICATION.md) | VBS v1.0.0: required root files, variables, Docker, attribution, and open-source licensing |
| [Bot README template](./bot-standard/README.md) | README structure expected from catalog bots |
| [Bot standard assets](./bot-standard/) | Template `.env.example`, `.dockerignore`, `Dockerfile`, `LICENSE`, `global_settings.json`, and an example bot archive |

## Design system

| Document | Content |
| --- | --- |
| [Brand identity and design system](./brand-identity/README.md) | Index for logo, colors, typography, tokens, components, layouts, and accessibility |

## Related root documents

- [README.md](../README.md) — product overview, current implementation status, and development setup.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — contribution workflow for the platform and rules for catalog submissions.
- [ROADMAP.md](../ROADMAP.md) — phases, milestones, and open questions.
- [SECURITY.md](../SECURITY.md) — private vulnerability reporting and scope.
- [CHANGELOG.md](../CHANGELOG.md) — notable changes to the repository.
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) — community conduct expectations.
- [ssl/README.md](../ssl/README.md) — TLS certificate pair expected by the commented HTTPS block in `nginx/nginx.conf`.
