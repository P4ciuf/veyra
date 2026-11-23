# Tablet Layout

Related: [Desktop](desktop.md) · [Mobile](mobile.md) · [Navigation](../components/navigation.md)

**Range:** 640 – 1023px (covers portrait tablets and landscape phones). Tablets are touch-first: assume no hover and ≥ 44px targets.

## Container and grid

| Property | Value |
|---|---|
| Container | Fluid, max-width 100% |
| Reading content | Max 720px, centered |
| Page gutter | `space-6` (24px) |
| Grid | 8 columns |
| Column gap | `space-6` (24px) |

## Page templates

**Website:** Navbar (64px) → hero → search → results grid.
- Bot grid: 2 columns, gap `space-6`. Filters move into a top bar of chips plus a "Filters" button opening a side sheet (360px).

**Dashboard:** Sidebar is **collapsed to icons (72px)** by default in landscape and **hidden behind a menu button** in portrait. Opening it overlays the content as a 256px drawer with scrim; Esc, scrim tap and link selection close it.
- Detail pages become a single column; the aside stacks below the main column.

**Documentation:** Sidebar hidden behind a menu button; "On this page" collapses into a dropdown at the top of the article.

## Spacing adjustments

| Context | Token |
|---|---|
| Between page sections | `space-12` (48px) |
| Marketing sections | `space-16` (64px) |
| Cards padding | `space-5` (20px) – `space-6` (24px) |
| Form field gap | `space-5` (20px) |
| Dialog padding | `space-6` (24px) |

## Typography

| Style | Size / line height |
|---|---|
| Display | 44 / 52 |
| H1 | 32 / 40 |
| H2 | 26 / 32 |
| H3 | 20 / 28 |
| Body | 16 / 24 |
| Small | 14 / 20 |
| Caption | 12 / 16 |

## Navigation behavior

- Navbar: logo, 3–4 key links, search icon (expands to full-width overlay), menu button for the rest.
- Sidebar: icon rail or drawer (see above); tooltips are replaced by long-press labels; active item still marked with indicator and `aria-current`.
- Breadcrumbs: full path, truncating the middle with an "…" menu when it does not fit.
- Tabs: scrollable row with edge fade.

## Component adaptations

| Component | Tablet behavior |
|---|---|
| Buttons | `md` 40px with padding extended to a 44px hit area; `lg` for primary form actions |
| Bot Card | 2-column grid; action button stays visible (no hover-reveal) |
| Inputs | 44–48px height (`control-lg` recommended), 16px text |
| Dialogs | Centered modal, width min(480px, `100vw − 2 × space-6`); popovers with interactive content may use a side sheet |
| Select | Native `<select>` preferred |
| Toasts | Bottom-center, max 420px |
| Tables | Horizontal scroll inside a bordered container, first column sticky; or convert to stacked rows below 768px |
| Pagination | Numbered list with at most 5 page items + Prev/Next |

## Input modes

- Support touch, stylus and keyboard (external keyboards on tablets). Focus rings remain visible on keyboard focus.
- No functionality depends on hover; hover styles are wrapped in `@media (hover: hover)`.
- Respect orientation changes without losing state (e.g., open drawer or modal stays open).
