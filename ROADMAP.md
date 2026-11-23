# Veyra · Roadmap

Development plan for Veyra, organized in incremental phases. Each phase delivers something usable and prepares the next one.

**Legend:** `[ ]` to do · `[~]` in progress · `[x]` done

---

## Overview

| Phase | Name                 | Goal                                   | Outcome                                 |
| ----- | -------------------- | -------------------------------------- | --------------------------------------- |
| 0     | Foundations          | Stack, repo, design, data model        | Project ready for development           |
| 1     | Accounts and catalog | Auth, basic dashboard, bot catalog     | Browsable website                       |
| 2     | Web distribution     | Configuration and package generation   | **MVP**: working download               |
| 3     | Official Discord bot | Distribution from Discord              | Consistent website ↔ Discord experience |
| 4     | Reviews and guides   | Feedback and documentation             | Catalog with ratings                    |
| 5     | Tickets and support  | Integrated website ↔ Discord support   | Centralized assistance                  |
| 6     | Private testing      | Private categories on Discord          | Try bots before downloading             |
| 7     | Submission system    | Bot proposal, review and publication   | Community contributions                 |
| 8     | Hardening and launch | Security, testing, performance, launch | **Public release 1.0**                  |
| 9     | Post-launch          | Growth and evolution                   | Continuous improvement                  |

---

## Phase 0 · Foundations

**Goal:** define the technical and product foundations before writing application code.

- [~] Choose the stack (frontend, bot, and database decided; backend, package storage, and hosting remain TBD)
- [x] Create repository, monorepo structure and code conventions
- [x] Set up CI (lint, typecheck, test, build)
- [x] Define the project license
- [x] Write `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- [~] Design the data model: users, bots (single version field), categories, reviews, tickets, warnings, bot-add and authorization requests; distributions and independent version history still to design
- [x] Define the **Veyra bot standard**: `veyra.json`, `global_settings.json`, `.env.example`, README, license
- [x] Define the catalog metadata format ([Veyra Bot Metadata Specification](./docs/specifications/bot-metadata.md), [JSON Schema](./schemas/bot-metadata.schema.json))
- [x] Create brand identity and design system (logo, colors, components)
- [x] Create and structure the official Discord server (channels, roles, categories)
- [x] Define roles and permissions: user, contributor, staff, admin

**Done when:** core stack decisions are recorded, the repo has working CI, and the data model and bot standard are documented.

---

## Phase 1 · Accounts and catalog

**Goal:** a website where users can register and browse bots.

### Authentication

- [ ] Registration
- [ ] Login with secure sessions
- [ ] Logout and session management
- [ ] Password recovery
- [ ] Rate limiting on login and registration
- [ ] Secure password hashing
- [ ] (Optional) Discord login and Discord account linking

### User dashboard (basic)

- [ ] Profile and personal information
- [ ] Section structure: distributions, requests, tickets, reviews

### Catalog

- [ ] Catalog data model with categories and versions
- [ ] Catalog page with category filters and search
- [ ] Bot detail page: description, versions, requirements, license, documentation
- [ ] Load at least 2-3 initial bots for testing

**Done when:** a user can register, log in and browse the catalog.

---

## Phase 2 · Web distribution (MVP)

**Goal:** the core of the product, from selection to download.

### Distribution wizard

- [ ] Category selection
- [ ] Bot selection
- [ ] Version selection
- [ ] Bot configuration (name, description)
- [ ] Dynamic form for environment variables, generated from the `variables` array in the bot's [`veyra.json`](./docs/specifications/bot-metadata.md)
- [ ] Validation of submitted fields

### Distribution Service

- [ ] Copy the original repository into an isolated workspace (the original stays unchanged)
- [ ] Automatic update of `global_settings.json`
- [ ] `.env` generation with user values
- [ ] Apply **Veyra branding** (activity `Taken by Veyra`, description with the attribution block defined by the Veyra Bot Standard)
- [ ] Package creation (zip)
- [ ] Package storage
- [ ] Signed download link with **72-hour** expiration
- [ ] Automatic cleanup of expired packages

### Environment variable privacy

- [ ] No sensitive values in logs
- [ ] No sensitive values in embeds or public pages
- [ ] No persistence of values after generation (unless explicitly consented)
- [ ] Isolation: no user can access other users' packages

### Dashboard

- [ ] Distribution history
- [ ] Still-valid downloads and expiration status
- [ ] Ability to regenerate a package

**Done when:** a user configures a bot on the website and downloads a working, customized package.

---

## Phase 3 · Official Discord bot (distribution)

**Goal:** replicate distribution on Discord, with an experience consistent with the website.

- [ ] Set up and deploy the official bot
- [ ] **Main Panel** with interactive menu
- [ ] Category selection
- [ ] Version selection
- [ ] **Distribution Modal**: name, description, reference link (optional)
- [ ] **Distribution Embed**: name, description, category, version, link, 72h download link
- [ ] Reuse the Distribution Service shared with the website (no duplicated logic)
- [ ] DM with setup and hosting guide
- [ ] Handle users with closed DMs (fallback)
- [ ] Discord ↔ website account linking, so distributions show up in the dashboard
- [ ] Rate limiting and anti-abuse

**Done when:** full distribution from Discord, with the same rules and result as the website.

---

## Phase 4 · Reviews and guides

**Goal:** community feedback and hosting documentation.

### Reviews

- [ ] Rating (stars) and comment
- [ ] One review per user per bot, editable
- [ ] Reviews allowed only after the bot has been distributed to the user
- [ ] Overall rating in the catalog
- [ ] Review list on the bot page
- [ ] Reviews can also be left from Discord
- [ ] Review management in the dashboard
- [ ] Moderation: reporting and deletion by staff

### Guides

- [ ] Guides section on the website
- [ ] Guides for configuring, using and hosting bots
- [ ] Guide sent by DM after distribution

**Done when:** every bot has a rating, reviews and an accessible guide.

---

## Phase 5 · Tickets and support

**Goal:** centralized support across website and Discord.

### From the website

- [ ] Open a ticket from the dashboard: category, subject, description
- [ ] Attachments
- [ ] Unique ID per ticket
- [ ] Conversation view and history

### Discord integration

- [ ] Automatic creation of a dedicated channel in the support category
- [ ] Permissions: only staff and the user involved
- [ ] Two-way message sync website ↔ Discord
- [ ] Attachment sync
- [ ] Staff replies from Discord, user replies from the website (and Discord, if linked)

### Management

- [ ] Open / Closed status
- [ ] Closing by staff
- [ ] Conversation archiving on close
- [ ] Notifications for new replies

**Done when:** a ticket opened from the website is handled by staff on Discord and the conversation stays in sync.

---

## Phase 6 · Private testing

**Goal:** try bots inside Discord before downloading them.

> ⚠️ Technically the most complex phase: it requires running catalog bots in a controlled environment. An architectural decision is needed in Phase 0 (see [Risks](#risks-and-open-questions)).

- [ ] Command to create a private category
- [ ] Automatic permissions: owner and invitees only
- [ ] `#・guide` channel always first, read-only, with the complete guide
- [ ] Testing channels inside the category
- [ ] Interactive menu to select the bot to test
- [ ] Start and stop of the test bot
- [ ] Invite and remove other users (owner only)
- [ ] Infrastructure to run test bots in an isolated sandbox
- [ ] Limits: categories per user, duration, resources
- [ ] Automatic cleanup of inactive categories
- [ ] Ability to delete your own category

**Done when:** a user creates a private category, picks a bot, tries it and invites others.

---

## Phase 7 · Submission system

**Goal:** let the community contribute new bots.

### Request

- [ ] Form from the dashboard: name, description, category
- [ ] Public GitHub repository **or** file upload
- [ ] Contributor data: Discord name, GitHub profile, portfolio (optional)
- [ ] Automatic check of minimum requirements (public repo, license, README, `.env.example`, `veyra.json`)
- [ ] Validate `veyra.json` against the [official JSON Schema](./schemas/bot-metadata.schema.json) and run the semantic checks (duplicate variable names, SPDX identifiers, license policy, credentials)

### Staff review

- [ ] Staff panel with all request information
- [ ] `Pending` / `Approved` / `Rejected` states
- [ ] Mandatory reason on rejection
- [ ] Verification of repository, code and licenses (project and dependencies)
- [ ] User notification (website and Discord) on every status change
- [ ] Status visible in the dashboard

### Publication

- [ ] Final upload modal after approval (files or GitHub link)
- [ ] Source code acquisition
- [ ] **Technical and security checks** before publication
  - [ ] Dependency and known-vulnerability scan
  - [ ] Scan for malware, hardcoded secrets, suspicious behavior
  - [ ] Manual code review
  - [ ] Compatibility check with the Veyra standard (`veyra.json`, `global_settings.json`, `.env.example`)
  - [ ] Catalog metadata extraction from the validated `veyra.json`
- [ ] Integration into the catalog with independent versions
- [ ] Contributor credit on the bot page
- [ ] Update handling: new versions proposed by the contributor

**Done when:** a contributor submits a bot, staff approves it and the bot appears in the catalog.

---

## Phase 8 · Hardening and 1.0 launch

**Goal:** make the platform secure, stable and ready for the public.

### Security

- [ ] Audit of authentication and session handling
- [ ] Verify that no `.env` ends up in logs, errors or monitoring
- [ ] Verify that 72h links actually expire
- [ ] Protection against path traversal, injection and upload abuse
- [ ] Global rate limiting and anti-spam
- [ ] Backup and disaster recovery plan
- [ ] Penetration test or external review

### Quality

- [ ] Unit and integration tests on the Distribution Service
- [ ] End-to-end tests of the full flow (web and Discord)
- [ ] Load testing
- [ ] Accessibility and responsive design
- [ ] Monitoring, alerting and logging (without sensitive data)

### Legal and policy

- [ ] Terms of service and privacy policy (GDPR)
- [ ] Bot publication policy and handling of reports/removals
- [ ] Account and data deletion requests

### Launch

- [ ] Closed beta with selected users
- [ ] Feedback collection and fixes
- [ ] High-quality initial catalog
- [ ] Complete documentation
- [ ] **Release 1.0**

---

## Phase 9 · Post-launch

Ideas to evaluate based on community feedback:

- [ ] Updates for bots already downloaded (new version notifications)
- [ ] Per-version changelog
- [ ] Guided hosting or one-click deploy options
- [ ] Veyra CLI to download and configure bots from the terminal
- [ ] Contributor statistics (downloads, ratings)
- [ ] Public contributor profiles
- [ ] Badge and recognition system
- [ ] Tags, advanced search and featured bots
- [ ] Public catalog API
- [ ] Localization (Italian / English)
- [ ] User reporting of problematic bots

---

## Risks and open questions

| Topic                          | Risk                                                       | To decide                                                                                        |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Security of submitted bots** | A malicious bot in the catalog harms users                 | Scanning pipeline + mandatory manual review in Phase 7                                           |
| **Private testing**            | Running third-party code requires sandboxing and resources | Isolated containers, resource and time limits, dedicated test tokens                             |
| **User tokens and `.env`**     | A credential leak causes direct harm                       | In-memory generation, no persistence, no logging                                                 |
| **Licenses**                   | Distributing code with incompatible licenses               | License check during review; list of allowed licenses                                            |
| **Mandatory branding**         | A user can remove it from the downloaded code              | Clarify in policy that branding is a condition of use; accept it is a rule, not a technical lock |
| **Costs**                      | Storage, bandwidth and sandboxes on a free service         | Package expiry, per-user quotas, sustainable hosting                                             |
| **Moderation**                 | Review workload grows with the catalog                     | Staff tooling, standard checklists, new moderation roles                                         |
| **Discord ToS / rate limits**  | Mass creation of channels, categories and DMs              | Queues, throttling and per-user limits                                                           |

---

## Milestones

| Milestone               | Phases | Content                               |
| ----------------------- | ------ | ------------------------------------- |
| **M1 · Internal alpha** | 0–2    | Website, catalog and web distribution |
| **M2 · Closed beta**    | 3–5    | Discord bot, reviews, tickets         |
| **M3 · Open beta**      | 6–7    | Private testing and submissions       |
| **M4 · Release 1.0**    | 8      | Security, testing and public launch   |

---

_This roadmap is a living document: priorities and content may change based on feedback, resources and technical discoveries._
