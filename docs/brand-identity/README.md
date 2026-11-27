# Veyra Brand Identity & Design System

**Version 1.0** · Dark-first · Tokens, components and layout guidelines for the Veyra ecosystem

---

## 1. What is Veyra?

Veyra is a free and open-source platform for discovering, distributing, configuring, testing and hosting open-source Discord bots. It has two parts:

1. **Official website:** a central place to discover, explore, configure and access Discord bots.
2. **Bot ecosystem:** the ecosystem through which developers distribute their open-source bots via Veyra.

## 2. Purpose of this design system

This is the **single source of truth** for how Veyra looks and behaves: the website, dashboard, documentation and community platforms. It gives designers and frontend developers a shared set of tokens, component specifications and layout rules so every Veyra surface feels like one coherent, serious software product.

These are target-state specifications, not a description of shipped screens. The implemented site currently consumes these tokens in the authentication screens (`apps/site/src/components/auth.module.css`); the dashboard, catalog and navigation surfaces described here are still to be built. The site loads Geist and Geist Mono through `next/font/google` in `apps/site/src/app/layout.tsx`, but has not mapped them to Tailwind's `font-sans` / `font-mono` utilities; `tokens.css` is imported from `apps/site/src/app/globals.css` rather than linked from HTML.

## 3. Brand identity and visual principles

Veyra should feel **modern, professional, minimalist, reliable, developer-focused, technologically advanced and accessible**. It avoids gaming aesthetics, decorative clutter and gradient overuse.

1. **Content first**: bots and their status are the product; chrome stays quiet.
2. **One accent at a time**: Primary violet for the main action; gradient only for rare brand moments.
3. **State is always visible**: all interactive components define default, hover, active, focus-visible, disabled and loading states.
4. **Tokens, not values**: components use semantic tokens only.
5. **Depth by surface**: Background → Surface → Surface Elevated, then border, then shadow.
6. **Accessible by default**: WCAG 2.2 AA.

Full detail: [`brand/brand-guidelines.md`](brand/brand-guidelines.md).

## 4. Official logo

The Veyra logo is the only approved brand mark: a stylized geometric "V" in a cyan → blue → violet gradient on a transparent background. The committed asset is [`brand/logo.png`](brand/logo.png), a 500×500 RGBA PNG. It must never be redrawn, recolored, distorted, cropped, flattened onto a background, or given effects. Place it directly on an approved Background or Surface without a matte; a dark theme surface is preferred, but white or very light surfaces are allowed in light theme, print and docs (check contrast in each case). The transparent background lets the surface show through. Clear space is 25% of its height; minimum height is 24px.

Details: [`brand/logo-usage.md`](brand/logo-usage.md).

## 5. Color palette

**Mandatory colors (never change):**

| Token | HEX | Usage |
|---|---|---|
| Background | `#111318` | Main application background |
| Surface | `#1B1E27` | Cards, panels, surfaces |
| Surface Elevated | `#242834` | Dialogs, popovers, elevated elements |
| Border | `#303442` | Borders and dividers |
| Brand Cyan | `#05B7F2` | Cyan brand accent |
| Brand Blue | `#0755F5` | Blue brand accent |
| Primary | `#7657F6` | Primary actions and interactive elements |
| Brand Violet | `#8B22F5` | Violet brand accent |
| Accent | `#A78BFA` | Secondary highlights |
| Text Primary | `#F4F4F5` | Primary text |
| Text Secondary | `#C4C6D0` | Secondary text |
| Text Muted | `#9295A1` | Muted text |
| Success | `#22C55E` | Success |
| Warning | `#F59E0B` | Warning |
| Danger | `#EF4444` | Danger |
| Info | `#38BDF8` | Info |

**Brand gradient** (selective, decorative):
`linear-gradient(115deg, #05B7F2 0%, #0755F5 38%, #5624F7 68%, #8B22F5 100%)`

**Supplemental tokens** (added only where a mandatory color cannot meet contrast for a role; mandatory values are unchanged): `border-strong` `#737889`, `action-primary-text` `#FFFFFF`, `action-primary-hover` `#6A4BEF`, `action-primary-active` `#5B3FE0`, `danger-solid` `#DC2626`, `danger-text` `#F87171`, `text-disabled` `#6B6F7C`. Rationale and contrast table: [brand guidelines §4](brand/brand-guidelines.md#4-color).

## 6. Typography

| Style | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| Display | 56px | 700 | 60px | -0.03em |
| H1 | 36px | 700 | 44px | -0.02em |
| H2 | 28px | 650 | 36px | -0.015em |
| H3 | 20px | 600 | 28px | -0.01em |
| Body | 16px | 400 | 24px | 0 |
| Small | 14px | 400 | 20px | 0 |
| Caption | 12px | 500 | 16px | +0.01em |

Fonts: **Geist Sans** (primary), fallback `Inter, system-ui, sans-serif`; **Geist Mono** for code, IDs and versions. Display, H1 and H2 scale down on tablet and mobile (see [layouts](layouts/mobile.md)).

## 7. Spacing and border radius

- **Spacing (4px base):** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80` → `--vy-space-1`, `-2`, `-3`, `-4`, `-5`, `-6`, `-8`, `-10`, `-12`, `-16`, `-20`.
- **Radius:** Small 6 · Medium 10 · Large 14 · Extra Large 20 · Full 9999 → `--vy-radius-sm|md|lg|xl|full`.
- **Elevation:** `shadow-0 … shadow-4` plus `shadow-featured`; elevation is communicated first by surface color, then border, then shadow.

## 8. Component system

Each component documents purpose, appearance, tokens, and **default, hover, active, focus-visible, disabled and loading** states plus accessibility requirements.

| Group | Components | Doc |
|---|---|---|
| Buttons | Primary, Secondary, Ghost, Destructive | [`components/buttons.md`](components/buttons.md) |
| Cards | Default, Interactive, Featured, Bot Card | [`components/cards.md`](components/cards.md) |
| Inputs | Text, Search, Password, Textarea, Select, Checkbox, Switch | [`components/inputs.md`](components/inputs.md) |
| Badges | Verified, Official, Beta, Deprecated, Open Source | [`components/badges.md`](components/badges.md) |
| Navigation | Navbar, Sidebar, Breadcrumbs, Tabs, Pagination | [`components/navigation.md`](components/navigation.md) |
| Dialogs | Modal, Confirmation, Dropdown Menu, Popover, Tooltip | [`components/dialogs.md`](components/dialogs.md) |
| Feedback | Toasts, Alerts, Success/Error/Warning States, Empty States, Skeletons, Spinners | [`components/feedback.md`](components/feedback.md) |

## 9. Responsive design

| Layout | Range | Grid | Gutter | Container |
|---|---|---|---|---|
| [Mobile](layouts/mobile.md) | 0–639px | 4 cols | 16px | fluid |
| [Tablet](layouts/tablet.md) | 640–1023px | 8 cols | 24px | fluid |
| [Desktop](layouts/desktop.md) | 1024px+ | 12 cols | 32px | 1200px (1280px at 1280+) |

Navigation adapts from persistent sidebar and inline navbar (desktop) to icon rail/drawer (tablet) to drawer or bottom tab bar (mobile). Dialogs become bottom sheets on mobile. Touch targets are ≥ 44px.

## 10. Accessibility guidelines

WCAG 2.2 AA: full keyboard navigation, visible `:focus-visible` rings (Accent `#A78BFA`), AA contrast (verified pairs documented), accessible labels, semantic patterns, reduced-motion support, ≥ 44px touch targets, and never color alone to convey information. Full guide: [`accessibility.md`](accessibility.md).

## 11. Theme system

**Dark is primary** and uses the mandatory palette exactly. **Light is optional**, with independently designed semantic tokens (not an inversion): deeper violet Primary (`#5B3FE0`), darker status colors for AA text, off-white canvas (`#F7F8FA`), white cards, and shadow-based elevation.

```html
<html data-theme="dark">   <!-- default; use "light" for the optional light theme -->
```

Components read semantic tokens (`--vy-bg-surface`, `--vy-text-primary`, …) that are redefined per `data-theme`, so switching theme requires no component changes.

## 12. How developers use the tokens

Files in [`tokens/`](tokens/) are the machine-readable source of truth:

| File | Contents |
|---|---|
| [`colors.json`](tokens/colors.json) | Palette (mandatory, gradient, supplemental) and semantic tokens for `dark` and `light` |
| [`typography.json`](tokens/typography.json) | Font families, weights, scale, line heights, letter spacing, responsive sizes |
| [`spacing.json`](tokens/spacing.json) | Spacing scale, control sizes, breakpoints, container/grid, z-index layers |
| [`radius.json`](tokens/radius.json) | Border radius scale and nesting rule |
| [`shadows.json`](tokens/shadows.json) | Elevation (dark/light), border widths, focus ring |
| [`motion.json`](tokens/motion.json) | Durations, easing, reduced-motion rules |
| [`tokens.css`](tokens/tokens.css) | CSS custom properties (`--vy-*`) for the palette, type scale, spacing, sizing, radius, shadows, motion and z-layers; named layout/breakpoint, font-weight, border-width and focus-shadow tokens are not emitted, and two hard-coded `max-width` media queries override type sizes and line heights. No generator script is committed |

Quick start:

```html
<link rel="stylesheet" href="tokens/tokens.css">
```

```css
.card {
  background: var(--vy-bg-surface);
  border: 1px solid var(--vy-border-default);
  border-radius: var(--vy-radius-lg);
  padding: var(--vy-space-6);
  color: var(--vy-text-primary);
}
.btn-primary {
  background: var(--vy-action-primary);
  color: var(--vy-action-primary-text);
  border-radius: var(--vy-radius-md);
  height: var(--vy-control-md);
  padding-inline: var(--vy-space-4);
  font: 500 var(--vy-text-small-size)/var(--vy-text-small-line) var(--vy-font-sans);
  transition: background var(--vy-motion-fast) var(--vy-ease-standard);
}
.btn-primary:hover  { background: var(--vy-action-primary-hover); }
.btn-primary:active { background: var(--vy-action-primary-active); }
:focus-visible { outline: 2px solid var(--vy-focus-ring); outline-offset: 2px; }
```

Rules:

1. Use **semantic tokens** (`--vy-bg-surface`) in components; use raw palette tokens (`--vy-color-*`) only in brand/marketing code.
2. Never hard-code hex values, px radii or shadows.
3. Naming: kebab-case, `--vy-` prefix. Many tokens follow `JSON key = CSS name without prefix` (colors, spacing scale, radius, shadows, motion), but some groups use semantic prefixes — `sans` → `--vy-font-sans`, `popover` → `--vy-z-popover`. Check `tokens.css` for the exact name.
4. Edit the JSON sources and keep `tokens.css` in sync manually; no generator script is committed. The mandatory colors and scales are frozen for v1.x.
5. Tailwind/other tooling can consume `colors.json` directly (map `themes.dark.*` to CSS variables).

## 13. Documentation map

| Area | File |
|---|---|
| Brand | [`brand/brand-guidelines.md`](brand/brand-guidelines.md) · [`brand/logo-usage.md`](brand/logo-usage.md) · [`brand/logo.png`](brand/logo.png) |
| Tokens | [`colors.json`](tokens/colors.json) · [`typography.json`](tokens/typography.json) · [`spacing.json`](tokens/spacing.json) · [`radius.json`](tokens/radius.json) · [`shadows.json`](tokens/shadows.json) · [`motion.json`](tokens/motion.json) · [`tokens.css`](tokens/tokens.css) |
| Components | [`buttons`](components/buttons.md) · [`cards`](components/cards.md) · [`inputs`](components/inputs.md) · [`badges`](components/badges.md) · [`navigation`](components/navigation.md) · [`dialogs`](components/dialogs.md) · [`feedback`](components/feedback.md) |
| Layouts | [`desktop`](layouts/desktop.md) · [`tablet`](layouts/tablet.md) · [`mobile`](layouts/mobile.md) |
| Accessibility | [`accessibility.md`](accessibility.md) |

## Versioning

Semantic versioning. Patch: documentation fixes. Minor: new tokens or components. Major: changes to mandatory colors, the gradient, or the type/spacing/radius scales.
