# Veyra Bot Metadata Specification

**Specification version:** 1.0
**Manifest schema version:** `1.0`
**Status:** Initial specification
**JSON Schema:** [`schemas/bot-metadata.schema.json`](../../schemas/bot-metadata.schema.json)

This document defines the `veyra.json` manifest: the standardized contract between Discord bot developers and the Veyra platform. It is the reference for identifying, describing, validating, configuring, and distributing bots in the Veyra catalog.

Related documents:

- [Veyra Bot Standard (VBS)](../bot-standard/VBS-SPECIFICATION.md) — repository, Docker, attribution, and licensing requirements that complement this manifest.
- [Adding Your Bot to the Veyra Catalog](../ADDING_BOTS.md) — the submission process from the developer's point of view.
- [Documentation index](../README.md) — every document in `docs/`.
- [JSON Schema](../../schemas/bot-metadata.schema.json) — the machine-readable validation contract.

---

## 1. Purpose and scope

Every bot submitted to the Veyra catalog must include a `veyra.json` manifest in the root of its repository. The manifest is the single source of truth for the metadata Veyra uses to:

1. list the bot in the catalog;
2. validate the submission automatically;
3. build the configuration form for the bot's environment variables;
4. generate a customized, distributable package;
5. filter and present the bot by category, language, runtime, and license.

Without a manifest, Veyra would have to infer metadata from the README, `.env.example`, and source code. That inference is ambiguous, hard to validate, and unsafe to automate. The manifest makes the contract explicit and reproducible.

### 1.1 What the manifest is not

`veyra.json` does not replace the files required by the [Veyra Bot Standard](../bot-standard/VBS-SPECIFICATION.md). Each file has a different job:

| File | Purpose | Owner |
|---|---|---|
| `veyra.json` | Submission and catalog metadata consumed by Veyra. | Bot developer |
| `global_settings.json` | Runtime settings that users may edit after downloading the bot. | Bot developer, customized by Veyra during distribution |
| `.env.example` | Developer-facing template for environment variables. | Bot developer |
| `README.md` | Human documentation: features, commands, setup, and usage. | Bot developer |
| `LICENSE` | Complete license text. | Bot developer |
| `Dockerfile` | Build and runtime definition required by VBS. | Bot developer |

`veyra.json` is public because it lives in the public repository. It must never contain credentials, tokens, passwords, API keys, private keys, or any other secret.

### 1.2 Normative sources

This document explains the rules. The [JSON Schema](../../schemas/bot-metadata.schema.json) enforces them mechanically. If the two ever disagree, the disagreement is a defect in the specification: report it, and do not assume that one silently overrides the other.

The submission system is expected to apply both:

1. **Schema validation** — structural checks defined by the JSON Schema.
2. **Semantic validation** — checks that JSON Schema cannot express, such as duplicate variable names, membership in the SPDX License List, catalog license policy, and credential scanning.

---

## 2. File location and naming

- The file must be named exactly `veyra.json`, in lowercase.
- It must be located in the root of the submitted repository, next to `README.md` and `LICENSE`.
- It must contain exactly one JSON object.
- It must be encoded as UTF-8 without a byte-order mark.
- It must be strict JSON: no comments, no trailing commas, and no unquoted keys.
- Veyra does not accept alternative names such as `bot.json`, `metadata.json`, `.veyra.json`, `veyra.yaml`, or `veyra.yml`.

A repository represents one submitted bot. Version 1.0 of this specification does not define a monorepo layout for multiple independently submitted bots; split such bots into separate repositories, or submit one manifest for the bot the repository is being submitted for.

Every submitted release must contain a manifest whose `version` matches the release being submitted. The catalog may keep older validated versions alongside newer ones, each with its own manifest snapshot.

---

## 3. How Veyra processes the manifest

The submission system is planned for [Phase 7 of the roadmap](../../ROADMAP.md#phase-7--submission-system). The behavior below is the expected contract for that system. It is written as a sequence so developers know exactly what happens to their manifest and where a submission can fail.

1. **Retrieve the submission.** Veyra retrieves the submitted repository through its public HTTPS URL, or receives an uploaded source archive when the website supports uploads.
2. **Locate the manifest.** Veyra looks for `veyra.json` in the root of the submitted source tree. A manifest in a subdirectory does not satisfy the requirement.
3. **Parse the JSON.** Veyra parses the file as strict JSON. Invalid JSON is rejected before any metadata is read.
4. **Validate against the official schema.** Veyra validates the parsed object against [`schemas/bot-metadata.schema.json`](../../schemas/bot-metadata.schema.json) using a JSON Schema Draft 2020-12 validator.
5. **Reject invalid submissions with clear, actionable errors.** Each error identifies the JSON Pointer location, the violated constraint, the expected value or format, and a suggested fix. Veyra does not extract or publish partial metadata from an invalid manifest.
6. **Run semantic and security checks.** After schema validation, Veyra checks the rules that JSON Schema cannot express: unique variable names, SPDX License List membership, catalog license policy, and credential-like values. A manifest that passes the schema can still be rejected at this stage.
7. **Extract metadata only after successful validation.** Veyra uses the validated fields to create the catalog listing (name, description, category, version, license, repository), to expose language and runtime filters, to build the configuration form from `variables`, and to generate the distribution package and its `.env` file.
8. **Store the validated snapshot.** Veyra keeps the validated manifest with the submitted version. When a new version is submitted, its manifest is validated independently before publication; an invalid update never replaces a valid published version.
9. **Report the result.** The submitter sees the submission status and any validation errors. Publication still requires the technical, security, and staff review described in [Adding Your Bot to the Veyra Catalog](../ADDING_BOTS.md).

A submission that fails at step 2, 3, 4, or 6 is not published and is not partially imported into the catalog.

---

## 4. Top-level structure

A manifest is a JSON object with the following properties.

| Property | Type | Required | Summary |
|---|---|---|---|
| `schemaVersion` | string | Yes | Manifest format version. Must be exactly `"1.0"`. |
| `name` | string | Yes | Public bot name, 2–60 characters. |
| `description` | string | Yes | Short public description, 10–280 characters. |
| `category` | string | Yes | One of the ten controlled catalog categories. |
| `version` | string | Yes | Bot release version in SemVer 2.0.0 format. |
| `license` | string | Yes | SPDX license identifier or simple SPDX expression. |
| `repository` | string | Yes | Public HTTPS source-code repository URL. |
| `runtime` | object | Yes | Programming language, minimum runtime version, and optional requirements. |
| `variables` | array | Yes | Environment variables the bot reads; may be empty. |

Unknown top-level properties are rejected (`additionalProperties: false`). This catches typos such as `licence` or `discordVersion`, and it prevents ambiguous extensions. A new top-level property requires a new manifest schema version.

The minimal valid manifest contains all nine required properties, with an empty `variables` array. See [example 11.1](#111-minimal-valid-manifest).

---

## 5. General information

### 5.1 `schemaVersion`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Accepted value | `"1.0"` |

`schemaVersion` identifies the version of the manifest format, not the version of the bot. The bot's own release version belongs in `version`.

When this specification changes in a backward-incompatible way, the manifest schema version changes and a new schema is published. Version 1.0 of the schema accepts only `"1.0"`.

### 5.2 `name`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Length | 2–60 characters |
| Allowed characters | ASCII letters, digits, spaces, `.`, `_`, and `-` |
| First character | Letter or digit |
| Last character | Letter, digit, `.`, `_`, or `-` |
| Pattern | `^[A-Za-z0-9](?:[A-Za-z0-9 ._-]{0,58}[A-Za-z0-9._-])$` |

`name` is the default public name shown in the catalog. Veyra may let a user choose a different display name for a distributed copy; the manifest name remains the catalog identity of the bot.

Leading and trailing spaces are not allowed. Internal spaces are allowed. Unicode names are not accepted in schema version 1.0.

Examples: `Example Bot`, `Moderator Pro`, `music-helper`.

### 5.3 `description`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Length | 10–280 characters |
| Whitespace | Must not start or end with whitespace |

`description` is a short, concrete explanation of what the bot does. It is used on catalog cards and detail pages. It is not a marketing page and not a replacement for the README.

Examples:

- `A moderation bot with automod rules, warnings, and a staff audit log.`
- `A small example bot used in the documentation.`

### 5.4 `category`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Accepted values | The ten categories in [section 8](#8-categories) |

`category` is a controlled catalog value. Arbitrary categories are rejected. The list can only change through a new version of this specification; there is no extension mechanism in schema version 1.0.

### 5.5 `version`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Format | Semantic Versioning 2.0.0: `MAJOR.MINOR.PATCH` |
| Pre-release | Accepted, for example `2.1.0-beta.1` |
| Build metadata | Accepted, for example `1.4.2+build.17` |
| Pattern | Official SemVer 2.0.0 pattern (see the schema) |

`version` is the version of the bot release contained in the submitted repository. It must match the release that is being submitted. See [section 9](#9-versioning) for the meaning of MAJOR, MINOR, and PATCH.

### 5.6 `license`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Length | 2–128 characters |
| Format | SPDX license identifier or a simple SPDX expression |
| Operators | `AND`, `OR`, and `WITH` in uppercase, separated by spaces |
| Parentheses | Not supported in schema version 1.0 |

`license` identifies the license of the bot's source code. It must match the repository's `LICENSE` file and must satisfy the [Veyra Bot Standard licensing requirement](../bot-standard/VBS-SPECIFICATION.md#9-open-source-licensing). See [section 10](#10-licensing) for accepted examples and for the policy on proprietary or unlicensed projects.

### 5.7 `repository`

| Constraint | Value |
|---|---|
| Type | string |
| Required | Yes |
| Format | URI |
| Scheme | `https://` only |
| Maximum length | 2048 characters |
| Pattern | `^https://[^\s]+$` |

`repository` points to the public source code of the bot. It must be reachable by the Veyra team for review and by the distribution system, and it must be the repository that contains the submitted `veyra.json`.

The URL must not contain whitespace, credentials, query-string tokens, or fragments that carry secrets. If the repository contains private submodules or private assets required to run the bot, the submission is not eligible for the public catalog.

---

## 6. Runtime information

`runtime` is a required object. Unknown properties inside it are rejected.

| Property | Type | Required | Constraints |
|---|---|---|---|
| `language` | string | Yes | 1–32 characters; lowercase; pattern `^[a-z][a-z0-9+#.-]*$` |
| `version` | string | Yes | 1–32 characters; one to three numeric components; pattern `^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$` |
| `requirements` | array of strings | No | Maximum 10 items; unique; each 1–100 characters and not starting or ending with whitespace. Defaults to an empty array when omitted. |

### 6.1 `runtime.language`

`language` is the primary implementation language, written in lowercase canonical form. VBS allows any language, so the field is not limited to a closed list. Use consistent names:

| Language | Value |
|---|---|
| JavaScript | `javascript` |
| TypeScript | `typescript` |
| Python | `python` |
| Java | `java` |
| Kotlin | `kotlin` |
| C# | `csharp` |
| Go | `go` |
| Rust | `rust` |
| Ruby | `ruby` |
| PHP | `php` |

Names may contain lowercase letters, digits, `+`, `#`, `.`, and `-` after the first character, which covers values such as `c++`, `objective-c`, and `node.js`. Do not use display names such as `TypeScript` or `C#`; use the canonical lowercase value.

### 6.2 `runtime.version`

`version` is the **minimum supported runtime version**, not necessarily the exact version in the developer's environment. It accepts one to three numeric components:

- `24`
- `24.0`
- `24.0.0`
- `3.12`

No leading zeroes, prefixes such as `v`, range operators such as `>=`, or non-numeric components are accepted. Use `runtime.requirements` to describe additional constraints.

### 6.3 `runtime.requirements`

`requirements` lists additional runtime needs that are not captured by `language` and `version`. Each item is a short human-readable string, for example:

- `Docker Engine 27 or newer`
- `PostgreSQL 16 or newer`
- `FFmpeg available on PATH`

Omit the property or use an empty array when there are none. Duplicate strings are rejected. This field is informational: Veyra displays it in the catalog and review screens, but it does not install these requirements automatically.

---

## 7. Configuration variables

`variables` is a required array. It describes every environment variable the bot reads. An empty array is valid; a bot with no configurable environment variables declares `"variables": []`. The array may contain at most 50 entries.

Each entry is an object with the following properties.

| Property | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | 1–64 characters; pattern `^[A-Z][A-Z0-9_]*$`; unique within the array |
| `description` | string | Yes | 1–200 characters; must not start or end with whitespace |
| `required` | boolean | Yes | Whether Veyra must collect a value before generating a package |
| `secret` | boolean | Yes | Whether the value must be handled as sensitive |
| `default` | string | No | Maximum 1024 characters; single line; forbidden when `required` is `true` or `secret` is `true` |

Unknown properties inside a variable object are rejected.

### 7.1 Naming rules

Variable names follow the conventional POSIX environment-variable style:

- uppercase ASCII letters, digits, and underscores;
- the first character must be a letter;
- no lowercase letters, hyphens, dots, spaces, or leading underscores.

Examples: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`, `LOG_LEVEL`.

Variable names are compared case-sensitively. Because the pattern requires uppercase, an exact duplicate is the only possible duplicate.

**Duplicate names are rejected.** JSON Schema cannot enforce uniqueness of a property across array items. The schema rejects exactly identical variable objects through `uniqueItems`, and the Veyra submission system performs the additional semantic check that catches two entries with the same `name` but different descriptions. A duplicate is an error, not a case where the last entry wins.

### 7.2 Required and optional variables

| Declaration | Veyra behavior during configuration and distribution |
|---|---|
| `required: true`, no `default` | The variable is mandatory. Veyra prompts for it, masks it when `secret` is `true`, and blocks package generation while its value is missing or empty. |
| `required: false`, `default` present | Veyra pre-fills the default. If the user leaves the field empty, Veyra applies the default. If the user enters another value, the user's value wins. |
| `required: false`, no `default` | The variable is optional. If the user leaves it empty, Veyra omits the variable from the generated `.env`; it is not written as an empty string. |
| `secret: true` | The value is sensitive. Veyra masks it in the interface, never logs or displays it, and never stores it in plaintext in the catalog. |

A required variable cannot have a default. A default would make the variable optional and would contradict `required: true`. The schema rejects this combination.

### 7.3 Default values

`default` is a string, even when the value looks numeric or boolean. Veyra writes it as-is into the generated `.env`. Multi-line defaults are not allowed because they cannot be represented safely in a `.env` file.

Defaults are public: the manifest is part of the public repository. Therefore:

- a default must never contain a credential, token, password, API key, private key, or any other secret;
- a default on a `secret` variable is forbidden and rejected by the schema;
- a default that looks like a credential can still be rejected by the submission system's credential scan, even if it is syntactically valid.

### 7.4 Sensitive values

Secret handling is a requirement, not a suggestion:

- **Never log secrets.** Values of `secret` variables must not appear in application logs, build logs, error messages, analytics, audit trails, or support transcripts.
- **Never display secrets.** Veyra must show masked input and must not reveal the stored value back to the user or to staff through public or review interfaces.
- **Never store secrets in plaintext in the catalog.** The catalog stores only the variable metadata: name, description, `required`, and `secret`. Secret values are used to generate the user's package and must not be persisted in readable form.
- **Never put secrets in `veyra.json`.** The manifest is public. Real credentials belong in the user's own `.env` at distribution time, never in the repository.
- **Never bake secrets into images or packages.** Follow the [Veyra Bot Standard Docker requirement](../bot-standard/VBS-SPECIFICATION.md#8-docker-requirement) and Veyra's existing [security and privacy commitments](../../README.md#security-and-privacy).

If a workflow needs to persist a secret value so a user can regenerate a package, persistence requires explicit user consent and encryption at rest. The default behavior is not to persist it.

### 7.5 Missing values at distribution time

- Missing or empty value for a required variable → package generation is blocked with a field-level error.
- Empty value for an optional variable with a default → the default is applied.
- Empty value for an optional variable without a default → the variable is omitted from the generated `.env`.
- Unknown or undeclared variable names → not accepted by the configuration form. Veyra does not add arbitrary environment variables to a package.

---

## 8. Categories

`category` must be one of the ten values below. The list is closed: there is no `custom`, `plugin`, or free-text category in schema version 1.0. Adding or renaming a category requires a new version of this specification and a matching schema update.

| Value | Description | Use when | Avoid when |
|---|---|---|---|
| `moderation` | Rule enforcement and member discipline. | The bot's primary purpose is warnings, mutes, bans, automod, audit logs, or moderation workflows. | The bot mainly prevents attacks (`security`) or manages roles and channels (`management`). |
| `utility` | General-purpose helpers. | The bot provides reminders, polls, information lookup, converters, scheduling, or other everyday tools. | A more specific category clearly describes the primary purpose. |
| `music` | Music playback and voice features. | The bot plays audio from supported sources and manages queues or playback controls. | The bot only sends music links or notifications (`integration`). |
| `economy` | Virtual economies and progression. | The bot manages currencies, shops, inventories, gambling, rewards, or virtual items. | The bot only tracks activity levels (`community`). |
| `fun` | Entertainment and social play. | The bot provides games, memes, jokes, roleplay, or casual social features. | The bot is mainly a moderation or utility tool. |
| `community` | Community engagement and member experience. | The bot handles welcomes, suggestions, events, leveling, birthdays, or member activities. | The bot is mainly administrative (`management`). |
| `management` | Server administration. | The bot manages roles, channels, permissions, onboarding, templates, or backups. | The bot mainly enforces rules (`moderation`) or detects threats (`security`). |
| `security` | Proactive protection. | The bot detects raids, spam, phishing, suspicious accounts, or monitors security events. | The bot mainly applies routine moderation actions (`moderation`). |
| `integration` | Connections to external services. | The bot bridges Discord with GitHub, Twitch, YouTube, RSS, APIs, or other platforms. | The bot only uses an external API internally and does not expose the integration as its purpose. |
| `other` | Genuinely unclassifiable bots. | No other category fits after reviewing the list. | The bot fits any specific category; `other` is a last resort and may be reviewed or reclassified by Veyra. |

Choosing a category:

1. Choose the category that describes the bot's **primary** purpose, not every feature it has.
2. If two categories seem plausible, prefer the more specific one.
3. Use `other` only when no specific category fits.
4. Do not add a new category in the manifest. A value outside the list is rejected by the schema.

---

## 9. Versioning

### 9.1 Bot versions

`version` follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). The accepted form is:

```text
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

All three numeric components are required. For example, `1.0` is invalid; `1.0.0` is valid.

| Component | When to increment | Examples |
|---|---|---|
| MAJOR | Incompatible or breaking changes: removed commands, changed configuration variables, changed database schema that requires manual migration, or changed behavior that breaks existing installations. | `1.4.2` → `2.0.0` |
| MINOR | Backward-compatible functionality: new commands, new optional variables, new optional features, deprecations that still work. | `1.4.2` → `1.5.0` |
| PATCH | Backward-compatible bug fixes and documentation-only or internal changes that do not change behavior. | `1.4.2` → `1.4.3` |

Pre-release versions (`2.0.0-beta.1`) and build metadata (`1.4.2+build.17`) are accepted by the schema. A pre-release may be submitted to the catalog when the catalog accepts pre-release releases; the catalog must display it as a pre-release, not as a stable release. Build metadata does not affect version precedence.

The manifest `version` must match the release being submitted. The catalog may keep multiple versions of the same bot, each with its own validated manifest. An update is a new submission of a new version, not an in-place edit of a published version.

### 9.2 Manifest format version

`schemaVersion` is independent from the bot's `version`:

- `schemaVersion` identifies the manifest format and the validation rules.
- `version` identifies the bot release.

For schema version 1.0, `schemaVersion` is exactly `"1.0"`. Changes to the manifest format follow this policy:

| Change type | Schema version change | Effect on existing manifests |
|---|---|---|
| Documentation fixes that do not affect validation | No schema change | None. |
| New optional field, new category, or new enum value | MINOR | Existing manifests remain valid. |
| Removed or renamed field, tightened constraint, removed category, or changed meaning | MAJOR | Existing manifests may become invalid and must be migrated. |

The Veyra platform is expected to keep validating previous manifest schema versions for a documented transition period when a new version is released. Until that policy exists, only `"1.0"` is accepted.

### 9.3 Veyra Bot Standard version

The Veyra Bot Standard (VBS) has its own version, currently 1.0.0. A submission must identify the VBS version it follows in its README or documentation, as required by [VBS §12](../bot-standard/VBS-SPECIFICATION.md#12-versioning). This is separate from both `schemaVersion` and the bot's `version`.

---

## 10. Licensing

### 10.1 SPDX identifiers

`license` uses [SPDX license identifiers](https://spdx.org/licenses/). Use the exact SPDX short identifier, including capitalization and punctuation. Do not use a human-readable license name.

| SPDX identifier | License | Notes |
|---|---|---|
| `MIT` | MIT License | Permissive; common for small bots. |
| `Apache-2.0` | Apache License 2.0 | Permissive; includes an express patent grant. |
| `GPL-3.0-only` | GNU General Public License v3.0 only | Copyleft. Use `GPL-3.0-or-later` only if the project actually grants the "or later" option. |
| `BSD-3-Clause` | BSD 3-Clause "New" or "Revised" License | Permissive. |
| `ISC` | ISC License | Permissive. |
| `MPL-2.0` | Mozilla Public License 2.0 | Weak copyleft. |

The manifest license must match the repository's `LICENSE` file. If the manifest says `MIT` and the `LICENSE` file contains a different license, the submission is rejected during review.

### 10.2 SPDX expressions

Simple SPDX expressions are accepted:

- `MIT OR Apache-2.0` — the project may be used under either license.
- `MIT AND BSD-3-Clause` — both licenses apply.
- `GPL-3.0-only WITH Classpath-exception-2.0` — a license with an exception.

Rules for schema version 1.0:

- operators are uppercase `AND`, `OR`, and `WITH`;
- operators are separated from identifiers by single spaces;
- parentheses are not supported;
- the schema validates the expression syntax, while the submission system verifies each identifier against the official SPDX License List.

An expression that is not valid SPDX syntax, such as `MIT, Apache-2.0`, is rejected by the schema. A syntactically valid but nonexistent identifier, such as `MyCustomLicense`, is rejected by the submission system's SPDX check.

### 10.3 Proprietary and unlicensed projects

The public Veyra catalog accepts only bots distributed under an OSI-approved open-source license that permits the distribution and use described by [VBS §9](../bot-standard/VBS-SPECIFICATION.md#9-open-source-licensing). The manifest can still represent a proprietary project without misrepresenting it as open source:

| Situation | Manifest value | Catalog eligibility |
|---|---|---|
| Proprietary or private project | `LicenseRef-Proprietary` | Not eligible for the public catalog. The value is schema-valid for private manifests and internal tooling. |
| No license granted | `LicenseRef-Proprietary` | Not eligible. Do not use `MIT` or another license unless the project actually grants it. |
| SPDX `NONE` or `NOASSERTION` | Syntactically accepted by the schema pattern | Not accepted for catalog submissions. Use `LicenseRef-Proprietary` for proprietary projects instead. |

`LicenseRef-Proprietary` is **not** an open-source license. A bot using it must not be labeled "Open Source" in the catalog, and the submission system rejects it with `VEYRA-MANIFEST-012` when the submission targets the public catalog. Veyra is an open-source bot distribution platform; proprietary submissions are outside its current public policy.

---

## 11. Valid examples

Every example in this section is a complete, valid `veyra.json`. All of them pass the official schema.

### 11.1 Minimal valid manifest

This is the smallest valid manifest: all required properties are present, and the bot declares no environment variables.

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

### 11.2 Complete bot manifest

This manifest exercises every top-level field, runtime requirements, and the three variable kinds.

```json
{
  "schemaVersion": "1.0",
  "name": "Moderator Pro",
  "description": "A moderation bot with automod rules, warnings, and a staff audit log.",
  "category": "moderation",
  "version": "2.3.1",
  "license": "Apache-2.0",
  "repository": "https://github.com/example-org/moderator-pro",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0",
    "requirements": [
      "Docker Engine 27 or newer",
      "PostgreSQL 16 or newer"
    ]
  },
  "variables": [
    {
      "name": "DISCORD_TOKEN",
      "description": "Token used to authenticate the bot with Discord.",
      "required": true,
      "secret": true
    },
    {
      "name": "DISCORD_CLIENT_ID",
      "description": "Discord application (client) ID used to register global commands.",
      "required": true,
      "secret": false
    },
    {
      "name": "DATABASE_URL",
      "description": "PostgreSQL connection string used by the bot.",
      "required": true,
      "secret": true
    },
    {
      "name": "LOG_LEVEL",
      "description": "Minimum log level: debug, info, warn, or error.",
      "required": false,
      "secret": false,
      "default": "info"
    },
    {
      "name": "AUDIT_CHANNEL_ID",
      "description": "Optional Discord channel ID that receives staff audit events.",
      "required": false,
      "secret": false
    }
  ]
}
```

### 11.3 Manifest with multiple environment variables

This example focuses on the three variable kinds: a required secret, an optional variable with a default, and an optional variable without a default.

```json
{
  "schemaVersion": "1.0",
  "name": "Config Demo",
  "description": "A bot that demonstrates the three variable types.",
  "category": "utility",
  "version": "0.4.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/config-demo",
  "runtime": {
    "language": "python",
    "version": "3.12"
  },
  "variables": [
    {
      "name": "API_KEY",
      "description": "API key for the external service.",
      "required": true,
      "secret": true
    },
    {
      "name": "CACHE_TTL",
      "description": "Cache lifetime in seconds.",
      "required": false,
      "secret": false,
      "default": "300"
    },
    {
      "name": "WEBHOOK_URL",
      "description": "Optional webhook that receives status events.",
      "required": false,
      "secret": false
    }
  ]
}
```

---

## 12. Invalid examples

Each example below is rejected for exactly the reason stated. Examples marked **semantic** pass the JSON Schema but are still rejected by the submission system's additional checks. Examples marked **schema** fail JSON Schema validation.

### 12.1 Unsupported category (schema, `VEYRA-MANIFEST-004`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "games",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** `games` is not one of the ten controlled categories. The schema's `enum` rejects it.

**Fix:** use `fun` for games and entertainment, or `community` when the bot's primary purpose is community engagement.

### 12.2 Invalid bot version (schema, `VEYRA-MANIFEST-005`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** `version` must contain MAJOR, MINOR, and PATCH. `1.0` is not valid SemVer 2.0.0.

**Fix:** use `1.0.0`.

### 12.3 Missing required field (schema, `VEYRA-MANIFEST-003`)

```json
{
  "schemaVersion": "1.0",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** `name` is required at the top level and is missing.

**Fix:** add `"name": "Example Bot"`.

### 12.4 Unexpected property (schema, `VEYRA-MANIFEST-006`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "homepage": "https://example.com",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** `homepage` is not part of schema version 1.0, and the top level rejects unknown properties.

**Fix:** remove `homepage`. If the bot needs a link, put it in the README or use the existing `repository` field.

### 12.5 Malformed variable name (schema, `VEYRA-MANIFEST-007`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": [
    {
      "name": "discord-token",
      "description": "Token used to authenticate the bot with Discord.",
      "required": true,
      "secret": true
    }
  ]
}
```

**Why it fails:** variable names must match `^[A-Z][A-Z0-9_]*$`. `discord-token` contains lowercase letters and a hyphen.

**Fix:** use `DISCORD_TOKEN`.

### 12.6 Secret variable carrying a default (schema, `VEYRA-MANIFEST-008`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": [
    {
      "name": "API_KEY",
      "description": "API key for the external service.",
      "required": true,
      "secret": true,
      "default": "placeholder"
    }
  ]
}
```

**Why it fails:** a `secret` variable cannot define a `default`. The manifest is public, so a default would expose a value that is supposed to be sensitive. The schema's conditional rule rejects the combination.

**Fix:** remove `default` and let Veyra prompt for the value during configuration.

### 12.7 Default on a required variable (schema, `VEYRA-MANIFEST-008`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": [
    {
      "name": "PORT",
      "description": "Port used by the bot's health endpoint.",
      "required": true,
      "secret": false,
      "default": "3000"
    }
  ]
}
```

**Why it fails:** `required: true` and `default` are contradictory. A variable with a value available at configuration time is optional, not required.

**Fix:** either set `"required": false` and keep the default, or remove the default and keep `"required": true`.

### 12.8 Invalid license expression (schema, `VEYRA-MANIFEST-010`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT, Apache-2.0",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** `MIT, Apache-2.0` is not a valid SPDX expression. Commas are not operators.

**Fix:** use `MIT OR Apache-2.0` or `MIT AND Apache-2.0`, depending on what the project actually grants.

### 12.9 Repository URL without HTTPS (schema, `VEYRA-MANIFEST-013`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "http://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": []
}
```

**Why it fails:** only `https://` repository URLs are accepted.

**Fix:** use `https://github.com/example-org/example-bot`.

### 12.10 Duplicate variable names (semantic, `VEYRA-MANIFEST-009`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": [
    {
      "name": "DISCORD_TOKEN",
      "description": "Token used to authenticate the bot with Discord.",
      "required": true,
      "secret": true
    },
    {
      "name": "DISCORD_TOKEN",
      "description": "Duplicate declaration used to demonstrate the semantic check.",
      "required": false,
      "secret": true
    }
  ]
}
```

**Why it fails:** two variables declare the same `name`. The objects differ, so the schema's `uniqueItems` check does not catch them; the submission system's semantic duplicate-name check does.

**Fix:** keep one declaration per variable name. Decide whether the variable is required or optional and delete the other entry.

### 12.11 Manifest embedding a credential-like default (semantic, `VEYRA-MANIFEST-011`)

```json
{
  "schemaVersion": "1.0",
  "name": "Example Bot",
  "description": "A small example bot used in the documentation.",
  "category": "utility",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example-org/example-bot",
  "runtime": {
    "language": "typescript",
    "version": "24.0.0"
  },
  "variables": [
    {
      "name": "BOT_TOKEN",
      "description": "Example variable that incorrectly embeds a credential.",
      "required": false,
      "secret": false,
      "default": "MTAwMDAwMDAwMDAwMDAwMDAw.GaRbAg.FakeSignaturePlaceholder"
    }
  ]
}
```

**Why it fails:** the default value looks like a Discord token. The value above is an intentionally fake example, never a real credential. The schema accepts the string because JSON Schema cannot recognize credentials; the submission system's credential scan rejects it as a likely secret.

**Fix:** mark the variable `"secret": true` and remove `default`, so Veyra prompts the user for the token at configuration time. Never commit a real token, even in a private branch.

---

## 13. Validating a manifest

Use any JSON Schema Draft 2020-12 validator. The schema is [`schemas/bot-metadata.schema.json`](../../schemas/bot-metadata.schema.json). Run the following snippet from the repository root; it uses the optional Python `jsonschema` package, which is not a project dependency.

```python
import json
from jsonschema import Draft202012Validator

with open("schemas/bot-metadata.schema.json", encoding="utf-8") as schema_file:
    schema = json.load(schema_file)

with open("veyra.json", encoding="utf-8") as manifest_file:
    manifest = json.load(manifest_file)

validator = Draft202012Validator(schema)
errors = sorted(validator.iter_errors(manifest), key=lambda error: list(error.absolute_path))

for error in errors:
    location = "/".join(str(part) for part in error.absolute_path) or "(root)"
    print(f"{location}: {error.message}")

if not errors:
    print("veyra.json is valid")
```

Schema validation is necessary but not sufficient. A local validator cannot check duplicate variable names, SPDX License List membership, catalog license policy, or credential-like values; those checks belong to the Veyra submission system described in [section 3](#3-how-veyra-processes-the-manifest).

---

## 14. Common validation errors

The error codes below are the expected stable identifiers used by the submission system. The exact human-readable message may change, but the code, JSON Pointer location, and remediation stay stable.

| Code | Layer | Cause | Fix |
|---|---|---|---|
| `VEYRA-MANIFEST-001` | Retrieval | `veyra.json` is missing from the repository root. | Add `veyra.json` at the root, next to `README.md`. |
| `VEYRA-MANIFEST-002` | Parsing | The file is not valid JSON. | Remove comments and trailing commas; validate the file with a JSON parser. |
| `VEYRA-MANIFEST-003` | Schema | A required top-level or nested property is missing. | Add the property named in the error. The required top-level properties are listed in section 4. |
| `VEYRA-MANIFEST-004` | Schema | `category` is not one of the ten controlled values. | Use a value from [section 8](#8-categories). |
| `VEYRA-MANIFEST-005` | Schema | `version` is not valid SemVer 2.0.0. | Use `MAJOR.MINOR.PATCH`, with optional pre-release and build metadata. |
| `VEYRA-MANIFEST-006` | Schema | The manifest contains an unknown property. | Remove it, or use a supported field. New fields require a new schema version. |
| `VEYRA-MANIFEST-007` | Schema | A variable definition is invalid: bad name, description, type, or missing required key. | Follow [section 7](#7-configuration-variables). |
| `VEYRA-MANIFEST-008` | Schema | A `default` is present on a required or secret variable. | Remove the default, or make the variable optional and non-secret when a public default is truly appropriate. |
| `VEYRA-MANIFEST-009` | Semantic | Two or more variables declare the same `name`. | Keep exactly one declaration per variable. |
| `VEYRA-MANIFEST-010` | Schema / semantic | `license` is not valid SPDX syntax, or an identifier is not in the SPDX License List. | Use a valid SPDX identifier or simple expression, for example `MIT` or `MIT OR Apache-2.0`. |
| `VEYRA-MANIFEST-011` | Security | A value looks like a credential, token, password, or private key. | Remove it. Mark the variable `secret` and let Veyra collect the value at configuration time. |
| `VEYRA-MANIFEST-012` | Policy | The license is not eligible for the public catalog, for example `LicenseRef-Proprietary`. | Use an OSI-approved open-source license permitted by [VBS §9](../bot-standard/VBS-SPECIFICATION.md#9-open-source-licensing). |
| `VEYRA-MANIFEST-013` | Schema | `repository` is not an HTTPS URL. | Use the public `https://` URL of the repository. |

If several errors are present, Veyra reports all schema errors it can collect, not only the first one, so the submitter can fix them in one pass. The manifest is not partially imported: a submission with any blocking error is rejected.

---

## 15. Related documentation

- [Veyra Bot Standard (VBS)](../bot-standard/VBS-SPECIFICATION.md) — required root files, Docker, global commands, attribution, and open-source licensing.
- [Veyra Bot Standard README template](../bot-standard/README.md) — the README structure expected from catalog bots.
- [Adding Your Bot to the Veyra Catalog](../ADDING_BOTS.md) — eligibility, preparation, review, and distribution.
- [Contributing to Veyra](../../CONTRIBUTING.md) — platform contributions and catalog submission rules.
- [Development workflow](../development.md) — repository setup, tests, and CI.
- [Documentation index](../README.md) — every document in `docs/`.
- [Roadmap](../../ROADMAP.md) — the submission system is planned for Phase 7.
- [Security policy](../../SECURITY.md) — how to report a manifest validation or secret-handling bypass.
- [Brand identity: badges](../brand-identity/components/badges.md) — how license and trust badges are displayed in the catalog.

---

## 16. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-16 | Initial Veyra Bot Metadata Specification and JSON Schema. |
