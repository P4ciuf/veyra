# Cards

Related: [Badges](badges.md) · [Buttons](buttons.md) · [Feedback (skeletons)](feedback.md#loading-skeletons) · [Desktop layout](../layouts/desktop.md)

## Purpose

Cards group related content on a surface. Use cards for discrete, self-contained items (a bot, a setting group, a stat). Do not nest more than two levels of card. Do not use a card when a plain section with a heading is enough.

## Shared properties

| Property | Value |
|---|---|
| Background | `bg-surface` (#1B1E27) |
| Border | 1px `border-default` (#303442) |
| Radius | `radius-lg` (14px) — Featured uses `radius-xl` (20px) |
| Padding | `space-6` (24px); compact `space-4` (16px); mobile `space-4` |
| Internal gap | `space-4` between sections, `space-2` between title and description |
| Title | H3 (20/28 · 600) or Body-semibold (16/24 · 600) in dense grids |
| Body text | Small (14/20 · 400), `text-secondary` |
| Metadata | Caption (12/16 · 500), `text-muted`; counts/versions in Geist Mono |
| Elevation | Level 1 (flat; `shadow-1` on hover only where interactive) |

## 1. Default card

Static container. No hover behavior and no pointer cursor.

| State | Specification |
|---|---|
| **Default** | As shared properties |
| **Hover** | No change (not interactive) |
| **Active** | No change |
| **Focus-visible** | Not focusable unless it contains interactive children; children handle their own focus |
| **Disabled** | Not applicable. For unavailable content use a visible status badge instead of dimming |
| **Loading** | Skeleton blocks replace content, same dimensions, `aria-busy="true"` |

## 2. Interactive card

The whole card is one link or button (e.g., opens a bot page).

| State | Specification |
|---|---|
| **Default** | As Default card, `cursor: pointer` |
| **Hover** | bg `bg-surface` + `overlay-hover`; border `border-strong`; `shadow-1`; `motion-fast` |
| **Active** | bg `bg-surface` + `overlay-active`; shadow removed |
| **Focus-visible** | `outline: 2px solid var(--vy-focus-ring); outline-offset: 2px` on the card |
| **Disabled** | `aria-disabled="true"`, title text `text-disabled`, no hover, `cursor: not-allowed`, plus a visible text reason |
| **Loading** | Skeleton; or if the action is loading, spinner at top-right and `aria-busy="true"` |

Implementation: make the **title** the `<a>` and stretch its hit area over the card (`a::after { content: ""; position: absolute; inset: 0; }`) so a single link is announced. Secondary controls inside (buttons) sit above with `position: relative; z-index: 1`. Do not wrap the whole card in `<a>` if it contains other interactive elements.

## 3. Featured card

Highlights one item per section (e.g., "Bot of the week", an official bot). Maximum **one** per viewport region.

| Property | Value |
|---|---|
| Radius | `radius-xl` (20px) |
| Padding | `space-8` (32px); mobile `space-6` |
| Accent | 2px top line using `--vy-gradient-brand` (the only gradient on the card) |
| Border | 1px `border-default` |
| Elevation | `shadow-featured` (Primary-tinted glow) |
| Title | H2 or H3 |

| State | Specification |
|---|---|
| **Default** | As above |
| **Hover** (if interactive) | border `border-strong`; `overlay-hover`; glow unchanged |
| **Active** | `overlay-active` |
| **Focus-visible** | Standard outline, offset 2px |
| **Disabled** | Not used; featured items must be available |
| **Loading** | Skeleton, with the accent line shown as a static `border-default` line |

Do not use the gradient as a card background or border on any other card.

## 4. Bot Card

The primary discovery unit on Veyra. Used in grids on the website and in lists on the dashboard. It is an **Interactive card** with fixed anatomy.

### Anatomy

```
┌──────────────────────────────────────────┐
│ [icon 48]  Bot name  (link)    [badges]  │
│            by author · v1.4.2            │
│                                          │
│ Short description, max two lines,        │
│ truncated with an ellipsis.              │
│                                          │
│ ★ 1.2k   ⬇ 8.4k servers   MIT   [Add]    │
└──────────────────────────────────────────┘
```

| Part | Specification |
|---|---|
| Container | Interactive card, padding `space-5` (20px); gap `space-4` |
| Icon | 48px (`avatar-bot`), `radius-lg`, 1px `border-default`, `bg-app` fill; image `alt=""` when name is adjacent |
| Name | Body-semibold (16/24 · 600), `text-primary`, one line, ellipsis; this is the stretched link |
| Author / version | Small (14/20), `text-muted`; version in Geist Mono |
| Badges | [Badges](badges.md), Caption; max 2 visible plus "+N"; order: Official, Verified, Beta/Deprecated, Open Source |
| Description | Small (14/20), `text-secondary`, clamp 2 lines (`-webkit-line-clamp: 2`) |
| Meta row | Caption mono, `text-muted`, `space-4` between items; each stat has an icon **and** a text label/aria-label |
| Action | Secondary `sm` button ("Add" / "Configure") aligned right; Primary is reserved for the bot detail page |
| Grid | Desktop 3 columns, tablet 2, mobile 1; gap `space-6` desktop/tablet, `space-4` mobile; min card width 280px |

| State | Specification |
|---|---|
| **Default** | `bg-surface`, border `border-default` |
| **Hover** | Interactive-card hover; name text underlined (non-color affordance) |
| **Active** | `overlay-active` |
| **Focus-visible** | Outline on the card when the title link is focused (`:has(a:focus-visible)` or `:focus-within` + `:focus-visible` on the link); inner buttons show their own ring |
| **Disabled / unavailable** | Not dimmed. Show a **Deprecated** or "Unavailable" badge and keep the card readable; the action button is disabled with `aria-disabled` and an explanatory tooltip |
| **Loading** | Skeleton: 48px rounded square, two text lines, two badges, footer line; `aria-busy` on the grid; same height as the real card |

Deprecated bot: description and title use `text-secondary` (not muted-disabled), the Deprecated badge is always visible.

## Accessibility

- Card title is a real heading or link; one tab stop per card for the primary link.
- Do not rely on hover to reveal essential actions (touch and keyboard users). Reveal-on-hover is allowed only for redundant shortcuts.
- Stats use text and icons together: `<span aria-label="1,200 stars">★ 1.2k</span>`.
- Focus ring ≥ 3:1 on Surface (Accent: 6.12:1).
- Truncated text is available in full via the link target page, and via `title` only as a progressive enhancement.
- Skeleton states: `aria-busy="true"` on the container and a visually hidden "Loading" message; no skeleton animation under `prefers-reduced-motion`.
