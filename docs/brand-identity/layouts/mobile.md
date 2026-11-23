# Mobile Layout

Related: [Desktop](desktop.md) · [Tablet](tablet.md) · [Navigation](../components/navigation.md) · [Inputs](../components/inputs.md)

**Range:** 0 – 639px. Design from 360px up; verify at 320px (no horizontal scrolling at 320px, WCAG reflow).

## Container and grid

| Property | Value |
|---|---|
| Container | Fluid, 100% width |
| Page gutter | `space-4` (16px); respect `env(safe-area-inset-*)` |
| Grid | 4 columns |
| Column gap | `space-4` (16px) |
| Max content width for text | 100% (line length naturally ≤ 45–60 ch) |

## Page templates

**Website:** Navbar (56px) → hero (Display scales to 36px, padding `space-10`) → search (full-width, `control-lg`) → single-column bot list.
- Bot Cards: 1 column, gap `space-4`, padding `space-4`. Description clamps to 2 lines; meta row wraps.
- Filters: a "Filters" button opens a full-height bottom sheet; applied filters appear as removable chips (44px targets).

**Dashboard:** No persistent sidebar. A bottom tab bar (max 5 items) for top-level destinations **or** a menu button opening a left drawer (≤ 85vw, max 320px). Page header: Back/Breadcrumb parent → H1 → actions. Primary action becomes a full-width button or a sticky bottom bar.

**Forms:** One column; labels above; Primary button full-width at the bottom (sticky bottom bar with `bg-surface`, top border `border-default`, safe-area padding).

## Spacing adjustments

| Context | Token |
|---|---|
| Between page sections | `space-10` (40px) |
| Marketing sections | `space-12` (48px) |
| Card padding | `space-4` (16px) |
| Form field gap | `space-5` (20px) |
| Dialog / sheet padding | `space-5` (20px) |
| Gap between stacked buttons | `space-3` (12px) |

## Typography

| Style | Size / line height |
|---|---|
| Display | 36 / 44 |
| H1 | 28 / 36 |
| H2 | 24 / 32 |
| H3 | 20 / 28 |
| Body | 16 / 24 (never below 16px in inputs) |
| Small | 14 / 20 |
| Caption | 12 / 16 |

Allow user text scaling up to 200% without loss of content; use `rem` units, no fixed heights on text containers.

## Navigation behavior

- **Navbar (56px):** menu button (44px), logo, search icon, avatar/sign-in. Search opens a full-screen overlay with an auto-focused input and a Cancel button.
- **Drawer:** slides from the left (`motion-slow`), `bg-surface`, scrim; focus trapped; Esc/scrim/back closes; focus returns to the menu button.
- **Bottom tab bar (dashboard):** 56px + safe area; icon (24px) **and** label (Caption); active tab: `accent` icon/label + 2px top indicator, `aria-current="page"`.
- **Breadcrumbs:** collapse to a single back link to the parent.
- **Tabs:** horizontally scrollable, no wrapping; selected tab auto-scrolls into view.
- **Pagination:** compact "Page X of Y" with Previous/Next (44px), or infinite scroll with a "Load more" button (never scroll-jacking).

## Component adaptations

| Component | Mobile behavior |
|---|---|
| Buttons | `lg` (48px) by default; primary actions full-width; icon buttons 44px minimum |
| Cards | Full width; stats row wraps; Featured card padding `space-6`, radius stays `radius-xl` |
| Inputs | 48px height, 16px text (prevents iOS zoom), correct `inputmode` and `autocomplete`; native `<select>`, date and file pickers |
| Checkbox / Switch | Entire row is the hit target (≥ 44px) |
| Modal | **Bottom sheet:** full width, `radius-xl` top corners only, max-height 90dvh, drag handle (decorative) + visible Close button, safe-area padding; Confirmation dialogs stay centered at `100vw − 2 × space-4` |
| Dropdown menu | Opens as a bottom action sheet; items 48px |
| Popover | Becomes a bottom sheet if interactive; otherwise anchored, ≤ `100vw − 2 × space-4` |
| Tooltip | Not used on touch; provide visible text or a help popover |
| Toasts | Top of screen below the navbar, full width minus gutters; never overlap the on-screen keyboard or sticky action bar |
| Tables | Convert to stacked "card rows" (label/value pairs) or scroll horizontally inside a container with a visible scroll affordance |
| Skeletons / spinners | Same specs; avoid full-screen spinners; keep layout stable |

## Touch and device considerations

- Interactive targets ≥ 44×44px with ≥ 8px between adjacent targets (`space-2`).
- Keep primary actions within thumb reach (bottom of screen).
- Support `dvh` units for full-height surfaces; use `env(safe-area-inset-bottom)` for fixed bars.
- Hover styles only inside `@media (hover: hover)`; use pressed states (`overlay-active`) for tap feedback.
- Support portrait and landscape; do not lock orientation.
- Respect `prefers-reduced-motion`, `prefers-color-scheme` (when light theme is enabled) and OS text scaling.
- Avoid gestures as the only way to perform an action (swipe actions must have a visible alternative).
