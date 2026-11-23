# Badges

Related: [Cards (Bot Card)](cards.md#4-bot-card) · [Brand guidelines](../brand/brand-guidelines.md) · [Bot Metadata Specification: licensing](../../specifications/bot-metadata.md#10-licensing)

## Purpose

Badges label the trust, maturity and licensing status of a bot or resource. They are **static, non-interactive labels**. Filter chips and removable tags are a different component and must meet button/target-size requirements.

## Shared properties

| Property | Value |
|---|---|
| Height | 24px |
| Padding | `space-2` (8px) inline; vertical size comes from the fixed 24px height |
| Typography | Caption (12/16 · 500, +0.01em), sentence case |
| Icon | 14px, leading, `currentColor`, decorative (`aria-hidden`); gap `space-1` |
| Radius | `radius-sm` (6px) |
| Border | 1px, variant-specific: tinted for most variants, solid `border-strong` for Open Source — see the table below |
| Content rule | **Always icon + text.** Color is never the only signal. |

## Variants

| Variant | Meaning | Background | Border | Text / icon | Suggested icon |
|---|---|---|---|---|---|
| **Verified** | Reviewed by Veyra: source builds, no known malicious code | `success-subtle` | `success-border` | `success` (#22C55E, 7.31:1 on Surface) | badge-check |
| **Official** | Maintained by the Veyra team | `action-primary-subtle` | `color-mix(in srgb, var(--vy-action-primary) 40%, transparent)` | `accent` (#A78BFA, 6.12:1) | shield |
| **Beta** | Pre-release; expect changes | `info-subtle` | `info-border` | `info` (#38BDF8, 7.77:1) | flask-conical |
| **Deprecated** | No longer maintained or superseded | `warning-subtle` | `warning-border` | `warning` (#F59E0B, 7.75:1) | triangle-alert |
| **Open Source** | Source is public; shows license | transparent | `border-strong` | `text-secondary` | git-branch / code |

**Open Source** may append the SPDX license in Geist Mono: `Open Source · MIT`. The identifier comes from the bot's `veyra.json` manifest; see [Bot Metadata Specification: licensing](../../specifications/bot-metadata.md#10-licensing).

## States

Badges are non-interactive, so interaction states do not apply.

| State | Specification |
|---|---|
| **Default** | As specified per variant |
| **Hover** | None. No pointer cursor. If a badge must link (e.g., license page), render it as a link with hover bg `overlay-hover`, underlined text, and focus ring |
| **Active** | None (linked badge: `overlay-active`) |
| **Focus-visible** | Not focusable (linked badge: 2px `focus-ring` outline, offset 2px) |
| **Disabled** | Not applicable. Do not dim badges |
| **Loading** | 24px-high, 64–88px-wide skeleton pill (`radius-sm`), see [skeletons](feedback.md#loading-skeletons) |

## Usage rules

- Order in a row: Official → Verified → Beta / Deprecated → Open Source.
- Show at most **two** badges on a Bot Card, then "+N" (a button revealing the rest in a popover). The detail page shows all.
- **Beta** and **Deprecated** are mutually exclusive. **Official** implies **Verified**; show only Official.
- Use `badge` text exactly as named; do not rename or invent new statuses without adding a spec here.
- Do not use badges for counts, notification dots or marketing ("New!") — use plain text.

## Accessibility

- Text and icon satisfy ≥ 4.5:1 on Surface and Surface Elevated (verified in [brand guidelines](../brand/brand-guidelines.md#44-verified-contrast-dark-theme)).
- The visible text is the accessible name; the icon is `aria-hidden="true"`.
- Provide explanatory help via a [tooltip](dialogs.md#tooltip) or popover on a **separate** help button for badges like Verified ("What does verified mean?"), not on the badge itself, to keep it a non-interactive label.
- In dense lists, preserve badges in the reading order right after the bot name.
