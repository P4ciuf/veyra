<div align="center">

# Veyra

**Open-source Discord Bot Distribution Platform**

Discover, test, configure, download and host open-source Discord bots. For free.

[Documentation](./docs/README.md) · [Roadmap](./ROADMAP.md) · [Contributing](#contributing)

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)
![Price](https://img.shields.io/badge/price-free-brightgreen)

</div>

---

## What is Veyra

Veyra is an **open-source and completely free** platform for distributing open-source Discord bots.

The goal is to make discovering, testing, configuring, downloading and hosting bots as simple and accessible as possible, offering a centralized ecosystem for both users and developers.

The platform has two main components:

| Component                   | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| **Official Website**        | Catalog, accounts, configuration, distribution, submissions and support |
| **Official Discord Server** | Bot-based distribution, private testing, community and tickets          |

The experience is designed to be **consistent** between the website and the Discord server.

---

## Current implementation status

Veyra is in early development: this document describes the **target product**, and the feature sections below are the plan, not current behavior. What exists today:

- **`apps/discordBot`** — the official bot skeleton: environment validation, auto-loading of interaction modules (commands, events, buttons, menus, modals) and Discord login. Loaded handlers are stored on the client, but no `interactionCreate` dispatcher or REST command registration exists yet, and there is no distribution flow.
- **`apps/site`** — a freshly scaffolded Next.js 16 app with a placeholder landing page and a `/api/health` endpoint used by the compose healthcheck.
- **`shared`** — workspace package with the logging facade used by the bot.
- **`database`** — Prisma 7 data layer scaffolded with the PostgreSQL driver adapter; declared as a workspace dependency by both apps but not imported by any application yet.
- **`docs/` and `schemas/`** — project documentation, the [Veyra Bot Metadata Specification](./docs/specifications/bot-metadata.md), and the official [`veyra.json` JSON Schema](./schemas/bot-metadata.schema.json).

The phased plan for everything else is tracked in [ROADMAP.md](./ROADMAP.md).

---

## Features

### Accounts and dashboard

- Registration and login with secure sessions
- Personal dashboard: distribution history, downloads, request status, tickets and reviews

### Bot distribution

- **Via Discord:** interactive panel → category → version → customization modal → embed with download link
- **Via website:** same flow, plus full configuration and environment variable setup
- Temporary download link valid for **72 hours**
- Setup and hosting guide sent by DM (Discord) or available on the website

### Bot configuration

- `global_settings.json` automatically updated with the name and description chosen by the user
- Dynamic form for the environment variables required by the selected bot, generated from the `variables` array in its [`veyra.json`](./docs/specifications/bot-metadata.md) manifest, written into the custom package's `.env`
- The original repository always remains unchanged

### Veyra branding

Every distributed bot keeps a reference to the project:

- Bot activity: `Taken by Veyra`
- Description ending with the attribution block defined by the [Veyra Bot Standard](./docs/bot-standard/VBS-SPECIFICATION.md)
- Links to the official Discord server and website

### Bot submissions

- Registered users can propose new bots (public GitHub link or file upload)
- Every repository includes a [`veyra.json`](./docs/specifications/bot-metadata.md) manifest validated against the [official JSON Schema](./schemas/bot-metadata.schema.json)
- Staff review with `Pending` / `Approved` / `Rejected` states
- Notifications on updates and final upload after approval
- Technical and security checks before publication

### Tickets and support

- Tickets can be opened from the website and are synced with a dedicated Discord channel
- Two-way conversation site ↔ Discord, attachments, Open/Closed status, history, unique ID

### Private testing

- Command to create a **private category** on the official server
- Protected `#・guide` channel, always in first position
- Interactive menu to choose the bot to test
- Ability to invite other users; permissions configured automatically

### Reviews

- Rating and comment for every distributed bot
- Overall rating shown in the catalog

---

## Distribution flow

```
Category → Bot → Version → Configuration → Environment variables
        → Package generation → Download (72h link) → Guide → Review
```

---

## Security and privacy

Environment variables (tokens, API keys, etc.) are treated as **confidential data**:

- they never appear in public embeds
- they are not accessible to other users
- they are never written to logs
- they are not permanently stored after the package is generated, unless explicitly needed and consented to by the user

Download links expire after 72 hours. Every submitted bot goes through manual review and security checks before entering the catalog.

---

## Bot catalog

Each bot is identified by:

- unique ID, name, description, category
- available versions (independent from each other)
- configuration info and required environment variables
- supported language and runtime requirements
- documentation
- license (SPDX identifier or expression)

The catalog metadata comes from the repository's [`veyra.json`](./docs/specifications/bot-metadata.md) manifest, which is validated against the [official JSON Schema](./schemas/bot-metadata.schema.json).

### Expected bot structure

```
my-bot/
├── veyra.json             # Veyra submission metadata (required)
├── global_settings.json   # customizable name, description, etc
├── .env.example           # required environment variables
├── README.md              # setup and usage instructions
├── Dockerfile             # required container build (VBS)
├── LICENSE
└── ...                    # source code
```

`veyra.json` is the machine-readable submission manifest; `global_settings.json` remains the runtime configuration file that users can edit after downloading the bot.

The complete template is [`docs/bot-standard/global_settings.json`](./docs/bot-standard/global_settings.json).
At minimum, the file exposes the bot name, description, developer, prefix, activity
(`Taken by Veyra`), and the Veyra links ([VBS §4](./docs/bot-standard/VBS-SPECIFICATION.md#4-global_settingsjson)).
A minimal shape:

```json
{
  "bot": {
    "name": "Custom Bot Name",
    "description": "Custom bot description",
    "developer": "Your Name or Organization",
    "prefix": "!",
    "activity": {
      "type": "Playing",
      "text": "Taken by Veyra"
    }
  },
  "links": {
    "veyra_website": "https://",
    "veyra_discord": "https://"
  }
}
```

---

## Requirements for submitting a bot

- The bot is **open-source** and its source code is available
- The repository is **public** (if provided as a link)
- The repository includes a valid [`veyra.json`](./docs/specifications/bot-metadata.md) manifest in its root
- The bot is **working**
- It includes setup and usage instructions
- It complies with [Veyra's publication terms](./docs/bot-standard/VBS-SPECIFICATION.md)
- The license is an OSI-approved open-source license, and the licenses of the project and its dependencies allow distribution

---

## Architecture

| Component            | Function                                                |
| -------------------- | ------------------------------------------------------- |
| Official Website     | Catalog, authentication, configuration and distribution |
| Official Discord Bot | Distribution, testing and ticket management             |
| Bot Repository       | Source code of the available bots                       |
| User Dashboard       | Accounts, distributions and requests                    |
| Submission System    | Proposal, review and publication                        |
| Ticket System        | Integrated support between website and Discord          |
| Distribution Service | Customization and package generation                    |

### Tech stack

Partially decided — Phase 0 of the [roadmap](./ROADMAP.md) is in progress.

| Area            | Choice                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| Frontend        | Next.js 16 (React 19, Tailwind CSS 4) — scaffolded in `apps/site`                        |
| Official bot    | TypeScript, discord.js v14, Node.js 24 — skeleton in `apps/discordBot`                   |
| Shared code     | TypeScript workspace package (`shared`), winston logging facade                          |
| Package manager | pnpm 12.18.0                                                                             |
| Backend / API   | _TBD_                                                                                    |
| Database        | PostgreSQL via Prisma 7 (`database` package scaffolded; not wired to an application yet) |
| Package storage | _TBD_                                                                                    |
| Hosting         | _TBD_                                                                                    |

---

## Repository structure

```
veyra/
├── apps/
│   ├── site/           # official website (Next.js)
│   └── discordBot/     # official Discord bot
├── catalog/            # catalog data and assets (placeholder)
├── database/           # Prisma data layer (schema and client)
├── docs/               # project documentation and guides
├── schemas/            # machine-readable specifications (JSON Schema)
├── shared/             # shared code between applications
├── tests/              # Vitest test suite
├── .github/            # CI workflows
├── CONTRIBUTING.md
├── CHANGELOG.md
├── ROADMAP.md
├── README.md
└── LICENSE
```

---

## Development setup

Requirements: Node.js 24+, pnpm 12.18.0, Git.

```bash
git clone https://github.com/P4ciuf/veyra.git
cd veyra
pnpm install
```

The bot needs Discord credentials: create `apps/discordBot/.env` and set
`DISCORD_TOKEN` and `DISCORD_CLIENT_ID` (both mandatory — the process exits
without them). The variable names are documented in the root `.env.example`.
Privileged intents (`MessageContent`, `GuildMembers`) must be enabled in the
Discord developer portal.

`pnpm install` runs the workspace `prepare` scripts, which build `shared` and
generate plus build `database` into its flat `dist/`; a fresh clone is therefore
runnable after the install. To rebuild explicitly, `pnpm -r build` builds every
workspace package (`shared`, `database`, the bot and the site). The bot still
resolves `shared` through the gitignored `shared/dist` output, so keep that
directory present.

```bash
pnpm -r build                   # builds shared, database, bot and site
pnpm --filter discord-bot dev   # run the bot in watch mode
```

Quality commands: `pnpm run lint`, `pnpm run typecheck` (bot, `shared`, tests and
site), `pnpm run test`, plus `pnpm -r build` in CI.
See [docs/development.md](./docs/development.md) for the complete workflow
(builds, tests, Git hooks, CI, Docker).

---

## Contributing

Veyra is built for the community. You can contribute in two ways:

1. **Submitting a bot** from your dashboard on the website (see [requirements](#requirements-for-submitting-a-bot)); the repository must include a [`veyra.json`](./docs/specifications/bot-metadata.md) manifest
2. **Contributing to the platform's code** through issues and pull requests

Before opening a PR, please open an issue to discuss the change. Read the full guidelines in [CONTRIBUTING.md](./CONTRIBUTING.md), which includes the dedicated submission process for the bot catalog ([docs/ADDING_BOTS.md](./docs/ADDING_BOTS.md)).

Security vulnerabilities must be reported privately, never through public issues — see [SECURITY.md](./SECURITY.md).

---

## Goals

- **Accessibility:** make open-source bots easily accessible to everyone
- **Free Distribution:** keep distribution free, always
- **Open Source:** accessible and modifiable source code
- **Simplicity:** simplify download, configuration and hosting
- **Testing:** let users try bots before using them on their own
- **Community:** build a community around Discord bots
- **Contribution:** let developers publish their own projects
- **Support:** provide centralized and integrated assistance

---

## Roadmap

Progress and development phases are tracked in [ROADMAP.md](./ROADMAP.md).

---

## License

Distributed under the [Apache License 2.0](./LICENSE) (`Apache-2.0`). Bots in the catalog keep the original license specified by their authors.

---

<div align="center">

**Made by P4ciuf**

</div>
