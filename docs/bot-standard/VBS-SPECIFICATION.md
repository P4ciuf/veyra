# Veyra Bot Standard (VBS)

**Version:** 1.0.0
**Status:** Initial specification

## 1. Purpose and scope

The Veyra Bot Standard defines the minimum repository, configuration, documentation, deployment, attribution, and licensing requirements for Discord bots distributed through Veyra.

The standard is language-agnostic. Any programming language or framework is acceptable if the bot meets all requirements and can be built and run through Docker.

Machine-readable submission metadata is defined separately by the [Veyra Bot Metadata Specification](../specifications/bot-metadata.md) and its [JSON Schema](../../schemas/bot-metadata.schema.json). The two documents are complementary: VBS defines the repository and runtime requirements, while the metadata specification defines the `veyra.json` manifest consumed by the catalog.

## 2. Required root files

Every compliant repository must contain these files at its root:

- `README.md`
- `veyra.json`
- `global_settings.json`
- `.env.example`
- `LICENSE`
- `Dockerfile`

A `.dockerignore` is strongly recommended. A `compose.yaml` is optional.

`veyra.json` is the submission and catalog manifest defined by the [Veyra Bot Metadata Specification](../specifications/bot-metadata.md). It must be located at the repository root and must validate against the [official JSON Schema](../../schemas/bot-metadata.schema.json). It is not a runtime configuration file.

## 3. README requirements

The README must be written in English and document the actual bot, not just provide generic boilerplate. It must describe:

- The bot's purpose and every implemented feature.
- All slash/application commands and all text commands, if any.
- Command descriptions, options, permissions, and examples.
- Requirements and dependencies.
- Installation and configuration.
- Every environment variable and every supported setting.
- How to build and run the bot with Docker.
- Required Discord permissions and Gateway Intents.
- Troubleshooting and security notes.
- Development and testing instructions.
- The selected license.

Do not list unimplemented features or commands.

## 4. global_settings.json

This file must be valid JSON and live in the repository root. It contains general, non-secret settings that users may change without editing source code.

`global_settings.json` is the runtime configuration file. It is separate from `veyra.json`, which declares submission and catalog metadata such as name, description, category, version, license, runtime, and environment variables. Keep the two files consistent, but do not merge them.

At minimum, it must expose:

- Bot name.
- Bot description.
- Developer name.
- Text-command prefix, if text commands are supported.
- Discord activity text and type.
- Veyra website and Discord server links.
- Any general feature toggles or user-editable settings relevant to the bot.

The activity text must be exactly `Taken by Veyra`.

Secrets and credentials must never be stored in this file. Bot-specific settings may be added, but must be documented in the README. Applications should validate the file at startup and report useful configuration errors.

If the bot does not support text commands, it must document that fact; the prefix may be an unused default or omitted only if the implementation and documentation clearly establish that text commands are unsupported.

## 5. Environment variables

`.env.example` must be present and list every environment variable used by the application.

The following variables are mandatory:

- `DISCORD_TOKEN`: Discord bot authentication token.
- `DISCORD_CLIENT_ID`: Discord Application ID / Client ID, used for global application-command registration.

Additional variables are allowed and must be documented. `.env.example` must contain placeholders, never real secrets. `.env` must be excluded from version control and must not be copied into public images.

The same variables must be declared in the `variables` array of `veyra.json`, which Veyra uses to build the distribution configuration form. Mark sensitive variables with `"secret": true` and never give them a default. Keep `.env.example` and the manifest in sync; see [Veyra Bot Metadata Specification §7](../specifications/bot-metadata.md#7-configuration-variables).

## 6. Global Discord commands

Discord application commands must be registered globally. Production deployments must not depend on a guild ID and must not register commands only to a test guild.

The application must use `DISCORD_CLIENT_ID` for application identity. Test-guild registration may be used as a local development convenience only if it is clearly separated from the production global registration path.

## 7. Veyra attribution

Every bot distributed through Veyra must:

1. Set its Discord presence activity text to exactly `Taken by Veyra`. The activity type is chosen by the developer.
2. End its public bot description with this attribution block:

   ```text
   Made by [Developer Name]
   [Official Veyra Website]
   [Official Veyra Discord Server]
   ```
3. Use the real developer name and the official Veyra URLs supplied by the platform.
4. Keep the attribution visible while the bot is distributed through Veyra.

The actual website and Discord invite URLs must be supplied by Veyra. Repositories must not invent substitute official URLs.

## 8. Docker requirement

Every bot must include a working `Dockerfile` at the repository root. It must:

- Build successfully from the repository root.
- Install or include the correct runtime and dependencies.
- Start the bot using its actual production startup command.
- Read `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` from runtime environment variables.
- Support user-editable `global_settings.json`, preferably mounted as a read-only configuration file.
- Avoid embedding secrets in image layers.

The programming language is unrestricted. Multi-stage builds are encouraged where appropriate. A Compose file may be supplied but does not replace the required Dockerfile.

## 9. Open-source licensing

The repository must contain the complete text of an OSI-approved open-source license that permits commercial use, modification, and redistribution.

Examples include the following [SPDX identifiers](https://spdx.org/licenses/):

- `MIT`
- `Apache-2.0`
- `BSD-2-Clause` / `BSD-3-Clause`
- `GPL-3.0-only` (or `GPL-3.0-or-later` when the project grants that option)
- `LGPL-3.0-only` (or `LGPL-3.0-or-later` when the project grants that option)
- `AGPL-3.0-only` (or `AGPL-3.0-or-later` when the project grants that option)

Permissive licenses such as `MIT` and `Apache-2.0` are suitable choices for projects that want to allow reuse with relatively few conditions. Copyleft licenses such as GPL, LGPL, and AGPL also permit commercial use and modification, but impose additional obligations when distributing modified or combined software or providing network access, depending on the license.

The developer must choose the license and include its complete, unmodified license text, with the appropriate copyright holder and year. Do not accept custom terms that prohibit commercial use, modification, or redistribution as an open-source license.

The manifest `license` field must use the SPDX identifier or simple expression that matches the `LICENSE` file. See [Veyra Bot Metadata Specification §10](../specifications/bot-metadata.md#10-licensing) for the full policy, including the `LicenseRef-Proprietary` convention for projects that are not open source and are therefore not eligible for the public catalog.

## 10. Language and framework

Any programming language, runtime, framework, or Discord library is permitted. The developer is responsible for documenting supported versions and providing a Docker image that runs the bot reliably.

## 11. Validation checklist

A submission is compliant only when all applicable checks pass:

- [ ] Required root files exist, including `veyra.json`.
- [ ] `veyra.json` validates against the [official JSON Schema](../../schemas/bot-metadata.schema.json).
- [ ] The manifest `version` matches the submitted release.
- [ ] The manifest `category` is one of the controlled values.
- [ ] The manifest `variables` match `.env.example` and the README.
- [ ] The manifest `license` matches `LICENSE` and uses a valid SPDX identifier or simple expression.
- [ ] `global_settings.json` is valid JSON and documented.
- [ ] `.env.example` contains `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`.
- [ ] No real credentials are committed.
- [ ] README documents all real features and commands.
- [ ] Production application commands are registered globally.
- [ ] Discord activity text is `Taken by Veyra`.
- [ ] Public description ends with the required Veyra attribution.
- [ ] `LICENSE` contains a complete qualifying open-source license.
- [ ] Docker image builds and the bot starts successfully.
- [ ] Bot language and framework are documented.

## 12. Versioning

VBS uses semantic versioning. A bot submission must identify the VBS version it follows in its README or documentation. Breaking changes to mandatory requirements require a new major standard version.

The manifest format has its own `schemaVersion` (`"1.0"` for this revision), which is independent from the VBS version and from the bot's `version`. See [Veyra Bot Metadata Specification §9](../specifications/bot-metadata.md#9-versioning) for the relationship between the three version numbers.
