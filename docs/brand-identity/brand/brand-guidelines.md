# Veyra Brand Guidelines

> Version 1.0 · Source of truth for the visual identity of the Veyra website, dashboard, documentation and community platforms.

Related: [Logo usage](logo-usage.md) · [Tokens](../tokens/) · [Components](../components/) · [Layouts](../layouts/desktop.md)

---

## 1. Brand essence

**Veyra** is a free, open-source platform for discovering, distributing, configuring, testing and hosting open-source Discord bots. It has two parts: the official website (discovery and management) and the bot ecosystem (where developers distribute their bots).

**Brand promise:** *Open-source bots, ready to run, easy to trust.*

### Positioning attributes

| Attribute | What it means visually | What it rules out |
|---|---|---|
| Modern | Clean geometry, generous space, restrained motion | Skeuomorphism, dated chrome, heavy bevels |
| Professional | Consistent grids, precise alignment, calm color | Playful illustrations, mascots, emoji as UI |
| Minimalist | Few colors per screen, content-led layouts | Decorative patterns, ornamental borders |
| Reliable | Predictable components, clear states, strong hierarchy | Surprising interactions, unexplained icons |
| Developer-focused | Monospace for code and IDs, dense-but-legible data | Marketing fluff in product UI |
| Technologically advanced | Subtle depth, precise typography, selective gradient | Neon glows, "cyberpunk" or gaming aesthetics |
| Accessible | WCAG 2.2 AA, visible focus, large targets | Color-only meaning, low-contrast "aesthetic" text |

## 2. Design principles

1. **Content first.** Bots, their status and their configuration are the product. UI chrome stays quiet.
2. **One accent at a time.** Primary violet marks the main action on a view. Brand gradient is rare and decorative.
3. **State is always visible.** Every interactive element shows default, hover, active, focus-visible, disabled and (where relevant) loading states.
4. **Tokens, not values.** Components consume semantic tokens only. Raw hex values never appear in component code.
5. **Depth by surface, not by effect.** Elevation is communicated first by surface color (Background → Surface → Surface Elevated), second by border, third by shadow.
6. **Accessible by default.** Accessibility is a baseline requirement, not a theme or an option.

## 3. Voice and tone

Clear, direct, technical but friendly. Sentences are short. Prefer verbs.

| Do | Don't |
|---|---|
| "Add bot to server" | "Let's get this party started!" |
| "Couldn't connect. Check your token and try again." | "Oops! Something went wrong 😢" |
| "Open source · MIT" | "100% FREE FOREVER!!!" |

Use sentence case for UI text. Use code font (Geist Mono) for commands, IDs, versions, environment variables and file paths.

## 4. Color

Full machine-readable definitions: [`tokens/colors.json`](../tokens/colors.json). CSS custom properties: [`tokens/tokens.css`](../tokens/tokens.css).

### 4.1 Mandatory palette (do not change)

| Token | HEX | Usage |
|---|---|---|
| Background | `#111318` | Main application background |
| Surface | `#1B1E27` | Cards, panels, menus, inputs, sidebar, navbar |
| Surface Elevated | `#242834` | Dialogs, popovers, dropdowns, tooltips, toasts |
| Border | `#303442` | Dividers and decorative borders |
| Brand Cyan | `#05B7F2` | Cyan brand accent |
| Brand Blue | `#0755F5` | Blue brand accent |
| Primary | `#7657F6` | Primary actions and interactive elements |
| Brand Violet | `#8B22F5` | Violet brand accent |
| Accent | `#A78BFA` | Secondary highlights, links, focus ring |
| Text Primary | `#F4F4F5` | Headings, primary text |
| Text Secondary | `#C4C6D0` | Supporting text |
| Text Muted | `#9295A1` | Metadata, placeholders |
| Success | `#22C55E` | Positive status |
| Warning | `#F59E0B` | Caution status |
| Danger | `#EF4444` | Error and destructive status |
| Info | `#38BDF8` | Neutral informational status |

**Background and Surface are the two primary interface colors.** Most of any screen should be one of these two.

### 4.2 Brand gradient

```css
background: linear-gradient(115deg, #05B7F2 0%, #0755F5 38%, #5624F7 68%, #8B22F5 100%);
```

Permitted: hero emphasis, Featured card accent line, logo surroundings, empty-state illustration accents, marketing sections, 2px accent underline for the active top-level navigation item.

Not permitted: Primary buttons, inputs, body text, table rows, repeated list items, large background fills behind text, more than one gradient element per viewport region.

The gradient's cyan end only reaches 2.32:1 against white. Text must never sit directly on the gradient unless the specific text/background pair has been verified at ≥ 4.5:1 (white on the blue-to-violet end: 5.76:1 to 7.02:1).

### 4.3 Supplemental colors

The mandatory colors are unchanged. These additions exist only because some mandatory colors cannot meet contrast requirements for specific roles.

| Token | HEX | Why it exists |
|---|---|---|
| `border-strong` (dark) | `#737889` | Border `#303442` is only 1.34:1 on Surface. WCAG 1.4.11 requires 3:1 for control boundaries. |
| `action-primary-text` | `#FFFFFF` | Text Primary `#F4F4F5` on Primary is 4.28:1 (fails AA). White is 4.70:1. |
| `action-primary-hover` / `-active` | `#6A4BEF` / `#5B3FE0` | Darker steps keep the white label at 5.43:1 and 6.50:1. |
| `danger-solid` | `#DC2626` | White on Danger `#EF4444` is 3.76:1 (fails). White on `#DC2626` is 4.83:1. |
| `danger-text` (dark) | `#F87171` | Danger `#EF4444` as text on Surface is 4.42:1 (just below AA). `#F87171` is 6.02:1. |
| `text-disabled` (dark) | `#6B6F7C` | Disabled text needs a distinct, quieter tone. |

### 4.4 Verified contrast (dark theme)

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| Text Primary `#F4F4F5` | Background | 16.90 | AAA |
| Text Primary | Surface | 15.14 | AAA |
| Text Primary | Surface Elevated | 13.38 | AAA |
| Text Secondary `#C4C6D0` | Background | 10.91 | AAA |
| Text Secondary | Surface | 9.78 | AAA |
| Text Secondary | Surface Elevated | 8.64 | AAA |
| Text Muted `#9295A1` | Background | 6.23 | AA |
| Text Muted | Surface | 5.58 | AA |
| Text Muted | Surface Elevated | 4.93 | AA |
| Accent `#A78BFA` | Background / Surface / Elevated | 6.83 / 6.12 / 5.40 | AA (text) |
| White | Primary `#7657F6` | 4.70 | AA |
| Primary `#7657F6` | Background / Surface | 3.95 / 3.54 | UI components (≥ 3:1) |
| Primary `#7657F6` | Surface Elevated `#242834` | 3.13 | UI components (≥ 3:1), not for text |
| `border-strong` `#737889` | Surface / Elevated | 3.79 / 3.34 | UI components |
| Success `#22C55E` / Warning `#F59E0B` / Info `#38BDF8` | Surface | 7.31 / 7.75 / 7.77 | AAA (text) |
| `danger-text` `#F87171` | Surface | 6.02 | AA (text) |
| White | `danger-solid` `#DC2626` | 4.83 | AA |

> **Rules that follow from this table**
> - Primary `#7657F6` is **not** used for body-size text. Use Accent `#A78BFA` for links and text highlights.
> - Primary may be used for icons, borders, indicators and fills (≥ 3:1 on Background and Surface).
> - Use `border-strong`, not `border-default`, for any border that defines a control.

### 4.5 Color is never the only signal

Status always pairs color with an icon and a text label (for example, ✓ "Verified", ⚠ "Deprecated"). Errors always include a message. Selected states include a shape change (check, underline, filled indicator) in addition to color.

## 5. Typography

Machine-readable definitions: [`tokens/typography.json`](../tokens/typography.json).

- **Primary:** Geist Sans, fallback `Inter, system-ui, sans-serif`.
- **Monospace:** Geist Mono.
- Geist is a variable font. Weight 650 (H2) is supported natively; on browsers or fallbacks without variable weights it resolves to 600.

| Style | Size | Weight | Line height | Letter spacing | Mobile size | Usage |
|---|---|---|---|---|---|---|
| Display | 56px | 700 | 60px | -0.03em | 36px (tablet 44px) | Marketing hero only |
| H1 | 36px | 700 | 44px | -0.02em | 28px (tablet 32px) | Page title |
| H2 | 28px | 650 | 36px | -0.015em | 24px (tablet 26px) | Section title |
| H3 | 20px | 600 | 28px | -0.01em | 20px | Card and dialog titles |
| Body | 16px | 400 | 24px | 0 | 16px | Reading text |
| Small | 14px | 400 | 20px | 0 | 14px | Secondary text, table cells |
| Caption | 12px | 500 | 16px | +0.01em | 12px | Badges, metadata |

Supporting styles: **Label** (14/20, 500) for form labels, buttons, tabs and menu items; **Code** (Geist Mono 14/20, 400); **Code caption** (Geist Mono 12/16, 500).

Rules: one H1 per page; heading levels never skip; body line length 45–75 characters; minimum body text on mobile is 16px (prevents iOS input zoom); left-align text, never justify.

## 6. Spacing, radius, elevation

Machine-readable: [`spacing.json`](../tokens/spacing.json), [`radius.json`](../tokens/radius.json), [`shadows.json`](../tokens/shadows.json).

**Spacing (4px base):** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80` → tokens `space-1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20`.

**Radius:** Small 6 · Medium 10 · Large 14 · Extra Large 20 · Full 9999.

| Element | Radius |
|---|---|
| Badges, checkboxes, tooltips | Small (6) |
| Buttons, inputs, selects, menu items, alerts | Medium (10) |
| Cards, dropdown menus, popovers, toasts | Large (14) |
| Modals, Featured cards | Extra Large (20) |
| Switches, pills, avatars, spinners | Full |

**Elevation:**

| Level | Surface color | Border | Shadow | Used by |
|---|---|---|---|---|
| 0 | Background | none | none | Page |
| 1 | Surface | border-default | none (shadow-1 on hover) | Cards, navbar, sidebar |
| 2 | Surface Elevated | border-default | shadow-2 | Dropdowns, popovers, tooltips |
| 3 | Surface Elevated | border-default | shadow-3 | Toasts |
| 4 | Surface Elevated | border-default | shadow-4 + scrim | Modals |

## 7. Iconography

- Recommended set: **Lucide** (open source, consistent, MIT-licensed, matches the open-source ethos). Any replacement must be a 24px-grid outline set with a consistent stroke.
- Stroke 1.5px at 20px; sizes 16 / 20 / 24 (`icon-sm`, `icon-md`, `icon-lg`).
- Icons inherit `currentColor`. Icon-only buttons always have an accessible name.
- No emoji as functional UI.

## 8. Imagery and illustration

- Product screenshots and real bot icons are preferred over stock imagery.
- Illustration (empty states, marketing) uses geometric line shapes in Text Muted and Accent on Background, with at most one gradient accent.
- Bot icons are shown in a 48px (`avatar-bot`) or 80px (`avatar-bot-lg`) container with `radius-lg`, on Surface, with a 1px `border-default`.

## 9. Motion

Tokens: [`tokens/motion.json`](../tokens/motion.json). Fast 120ms (hover/press), base 200ms (menus, switches), slow 320ms (modals, toasts). Animate only opacity, transform and color. Under `prefers-reduced-motion: reduce` all transitions collapse to instant and skeleton shimmer and spinner rotation are replaced with static or opacity-pulse alternatives.

## 10. Themes

Dark is the primary theme and uses the mandatory palette exactly. Light is optional and has its own semantic tokens designed for light contexts (see `themes.light` in `colors.json`). It is not an inversion: Primary becomes a deeper violet (`#5B3FE0`), semantic colors shift to darker steps for AA text contrast, elevation uses shadows rather than lighter surfaces, and the canvas is a cool off-white (`#F7F8FA`) with white cards.

The logo has a transparent background and is placed identically in both themes (see [logo usage](logo-usage.md)).

## 11. Do and don't

| Do | Don't |
|---|---|
| Use Primary for one main action per view | Use Primary for every clickable item |
| Use Surface cards on Background | Nest more than two card levels |
| Use gradient for one brand moment per section | Add gradients to buttons, badges or borders by default |
| Pair status color with icon and text | Rely on red/green alone |
| Use Geist Mono for IDs, versions, commands | Use monospace for headings or body |
| Keep ≥ 24px between unrelated groups | Fill space with decoration |
| Use tokens | Hard-code hex, px radius or shadows |

## 12. Governance

- Mandatory colors, the brand gradient, the type scale, the spacing scale and the radius scale are **frozen** for v1.x. Changes require a major version bump.
- Additions (new semantic tokens, components) are allowed in minor versions and must define all applicable states, contrast ratios and accessibility behavior.
- Tokens in `tokens/*.json` are the source of truth. `tokens/tokens.css` expresses the palette, type scale, spacing, sizing, radius, shadows, motion and z-layers, but omits named layout/breakpoint and font-weight tokens (two hard-coded media queries override type sizes); no generator script is committed, so update both together.
