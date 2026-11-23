# [Bot Name]

> [One-sentence summary of the bot and its purpose.]

[![Veyra](https://img.shields.io/badge/Distributed%20by-Veyra-5865F2)](https://YOUR-VEYRA-WEBSITE)

## Overview

[Describe the bot, the problem it solves, its intended users, and how it works. This section must be specific to this bot.]

## Features

Document **every user-facing feature**. For each feature, explain what it does, how users access it, required permissions, configuration options, and any limitations.

- **[Feature name]:** [What it does and how to use it.]
- **[Feature name]:** [What it does and how to use it.]

## Commands

List every slash command and every text command (if supported). Do not document commands that are not implemented.

| Command | Description | Required permissions | Options |
|---|---|---|---|
| `/help` | [Description] | [Permissions] | [Options] |

### Text commands

[If the bot supports text commands, document the configured prefix and every text command. If it does not, write: "This bot does not support text commands."]

## Requirements

- A Discord application and bot account.
- Docker Engine / Docker Compose (depending on the deployment method).
- [Other external services, runtimes, databases, or API access required by this bot.]

## Installation

1. Download or clone this repository.
2. Copy `.env.example` to `.env`.
3. Set `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in `.env`.
4. Review and edit `global_settings.json`.
5. Build and start the bot using the Docker instructions below.

Never publish `.env` or share your Discord token.

## Configuration

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Token used to authenticate the bot with Discord. |
| `DISCORD_CLIENT_ID` | Yes | Discord Application ID / Client ID. Used for global application-command registration. |
| `[OTHER_VARIABLE]` | [Yes/No] | [Purpose and accepted values.] |

Document every environment variable read by the application. Mark optional variables clearly and provide safe defaults where applicable.

The same variables must be declared in the `variables` array of `veyra.json`, marking sensitive values with `"secret": true`. Keep the README, `.env.example`, and the manifest in sync.

### `global_settings.json`

This file contains general, user-editable bot settings. Document every supported key, its type, default value, accepted values, and effect.

| Key | Type | Description |
|---|---|---|
| `bot.name` | string | Display name used by the bot where applicable. |
| `bot.description` | string | Short description of the bot. |
| `bot.developer` | string | Developer name used in the Veyra attribution. |
| `bot.prefix` | string | Prefix for text commands, if supported. |
| `bot.activity.type` | string | Discord activity type, such as `Playing`, `Listening`, or `Watching`. |
| `bot.activity.text` | string | Must be exactly `Taken by Veyra`. |
| `features` | object | Bot-specific feature toggles and settings. |
| `links.veyra_website` | string | Official Veyra website URL. |
| `links.veyra_discord` | string | Official Veyra Discord invite URL. |
| `logging.level` | string | Logging verbosity. |

Do not put secrets, tokens, passwords, or private keys in this file.

### Veyra metadata manifest

This repository also contains `veyra.json` in the root. It declares the submission and catalog metadata: name, description, category, version, license, repository, runtime, and environment variables. It is not a runtime configuration file.

Keep it consistent with this README, `.env.example`, and `LICENSE`. The manifest must validate against the [official JSON Schema](../../schemas/bot-metadata.schema.json); see the [Veyra Bot Metadata Specification](../specifications/bot-metadata.md) for every field and example.

## Discord application commands

Application commands (slash commands and other Discord interactions) must be registered **globally**, not to a specific guild.

- Use `DISCORD_CLIENT_ID` as the application ID.
- Do not require a test guild ID for production command registration.
- Do not register production commands exclusively with a guild-scoped endpoint.
- Explain how command registration and updates work for this bot.

Discord may take time to propagate global command changes.

## Veyra attribution requirements

Every Veyra-distributed bot must follow these attribution rules:

1. The bot's Discord presence activity text must be exactly **`Taken by Veyra`**. The activity type may be selected by the developer.
2. The bot's public description must end with the following attribution block, using the real developer name and official Veyra URLs:

   ```text
   Made by [Developer Name]
   [Veyra Website URL]
   [Veyra Discord Server URL]
   ```

3. Do not remove, obscure, or replace the attribution while the bot is distributed through Veyra.

## Run with Docker

A working, project-specific `Dockerfile` is mandatory. It must install or copy everything required and start the bot using the correct command for its language and framework.

### Build

```bash
docker build -t [image-name] .
```

### Run

```bash
docker run -d \
  --name [container-name] \
  --restart unless-stopped \
  --env-file .env \
  -v "$(pwd)/global_settings.json:/app/global_settings.json:ro" \
  [image-name]
```

Adjust the mounted path if the application expects `global_settings.json` somewhere other than `/app/`.

### Docker Compose (optional)

If a `compose.yaml` is provided, document its services, volumes, environment variables, and startup command here.

## Permissions and intents

Document the Discord permissions and Gateway Intents the bot needs, explain why each is needed, and follow the principle of least privilege.

## Troubleshooting

| Problem | Possible cause | Solution |
|---|---|---|
| Bot does not start | Missing or invalid environment variable | Check `.env` and container logs. |
| Commands do not appear | Commands were not registered globally or are still propagating | Verify the application ID and global registration process. |
| Configuration is ignored | Invalid JSON or unsupported key | Validate `global_settings.json` and check the documented keys. |
| Submission rejected for `veyra.json` | Missing file, invalid JSON, or schema violation | Validate the manifest against the official schema and fix the reported path. |

Add bot-specific troubleshooting entries.

## Security

- Never commit `.env`, tokens, passwords, or private keys.
- Validate configuration before starting.
- Run the container with only the permissions it needs.
- Keep dependencies and the base image updated.
- Do not expose internal errors or secrets in Discord messages or logs.

## Development

Explain how to install development dependencies, run tests, use linters, and contribute. Include the supported runtime and toolchain versions.

## License

This project is distributed under the license included in [`LICENSE`](./LICENSE). See that file for the complete terms.

## Credits

Distributed through [Veyra](https://YOUR-VEYRA-WEBSITE).

- Website: [Veyra](https://YOUR-VEYRA-WEBSITE)
- Discord: [Veyra Community](https://YOUR-VEYRA-DISCORD-INVITE)
