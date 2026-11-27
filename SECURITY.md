# Veyra Security Policy

This document explains how to report security vulnerabilities in Veyra and what
reporters can expect in return. Veyra is in early development: only the code in
this repository (the Discord bot, the website with account registration and
sign-in, shared packages, and the Prisma data layer) exists today. The first
release, [`v0.1.0`](https://github.com/P4ciuf/veyra/releases/tag/v0.1.0), was
published on 2026-11-27 as a pre-release from commit `28fce8f`.

## Supported Versions

Veyra follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) but is
still in the `0.x` pre-release stage. The only published release is
[`v0.1.0`](https://github.com/P4ciuf/veyra/releases/tag/v0.1.0); the work is
recorded in [CHANGELOG.md](./CHANGELOG.md) under `[Unreleased]` and `[v0.1.0]`.

| Version                 | Security fixes                 |
| ----------------------- | ------------------------------ |
| `main` (default branch) | Yes                            |
| `v0.1.0` (pre-release)  | Yes, in the next `0.x` release |

Security fixes are applied to the `main` branch and included in the next
release. Because `v0.1.0` is the only published version and the project is in
early development, older released versions are not maintained separately.

## Reporting a Vulnerability

**Do not open a public issue, pull request, or discussion for a security
vulnerability.** Public reports can expose details before a fix is available.

Report vulnerabilities privately through **GitHub Private Vulnerability
Reporting** on this repository:

- Open the repository's **Security** tab and choose **Report a vulnerability**,
  or go directly to
  <https://github.com/P4ciuf/veyra/security/advisories/new>.
- If Private Vulnerability Reporting is unavailable, contact the maintainer
  ([`@P4ciuf`](https://github.com/P4ciuf)) through GitHub.

A good report includes:

- **Affected component** (Discord bot, website, shared package, database,
  `veyra.json` validation, Docker/Compose, or nginx configuration) and the
  relevant files or endpoints, if known.
- **Version or commit**: the commit you tested against, or "current `main`".
- **Description and impact**: what the attacker could gain and who is affected.
- **Reproduction steps**: a minimal proof of concept, including any required
  configuration. Redact credentials, tokens, and personal data.
- **Suggested fix** (optional).

## Response Process and Timelines

1. **Acknowledgement** within approximately 5 business days of the report.
2. **Updates** at least once a week while the report is being assessed or a fix
   is being prepared.
3. **Resolution**: confirmed vulnerabilities are fixed on `main` and included
   in the next release. The time to fix depends on severity and complexity and
   is not guaranteed, so no fixed SLA is promised.

The maintainers may ask follow-up questions during the assessment; keeping the
GitHub advisory conversation open helps everyone stay in sync.

## Disclosure Policy

Veyra follows **coordinated disclosure**:

- Reports are handled privately until a fix is available.
- Fixes are announced in [CHANGELOG.md](./CHANGELOG.md) and, where applicable,
  through a GitHub Security Advisory on this repository.
- Reporters are credited (name or handle) in the advisory or changelog if they
  wish; anonymity is respected.
- Please do not publish details until the fix is released and a reasonable
  update window has passed. The disclosure date is agreed together with the
  reporter.

## Scope

In scope:

- Code in this repository: `apps/discordBot`, `apps/site`, `shared`, `database`,
  and the infrastructure configuration (Dockerfiles, `docker-compose.yaml`,
  `nginx/`).
- The `veyra.json` submission contract: validation bypasses, secret-handling
  flaws, or misleading documentation in the [Veyra Bot Metadata
  Specification](./docs/specifications/bot-metadata.md) and its
  [JSON Schema](./schemas/bot-metadata.schema.json). Treat manifests as
  untrusted input.

Out of scope:

- Vulnerabilities in third-party dependencies. Please report those to the
  upstream project first, unless the issue is caused by how Veyra uses them.
- Social engineering, phishing, physical attacks, spam, and denial of service
  through volume or automated scanning.
- Reports from automated tools without analysis or a demonstration of impact.
- Features described as planned but not yet implemented (see
  [ROADMAP.md](./ROADMAP.md)); those are suggestions, not vulnerabilities, and
  can be discussed publicly in the issue tracker.

## Safe Harbor

Good-faith research that follows this policy is welcome, and Veyra will not
seek action against reporters acting within it. Please respect other users'
privacy and data, avoid degrading the service, and stop and report as soon as
you can demonstrate a vulnerability. This policy does not authorize any
activity that is otherwise illegal.
