# Desktop Layout

Related: [Tablet](tablet.md) · [Mobile](mobile.md) · [Navigation](../components/navigation.md) · [`spacing.json`](../tokens/spacing.json)

**Range:** 1024px and wider (wide desktop: 1280px+).

## Breakpoints (all layouts)

| Name | Range | Token |
|---|---|---|
| Mobile | 0 – 639px | `mobile-max` = 639 |
| Tablet | 640 – 1023px | `tablet-min` = 640 |
| Desktop | 1024px+ | `desktop-min` = 1024 |
| Wide | 1280px+ | `wide-min` = 1280 |

Layout guidance is mobile-first: write base styles for the smallest viewport and
add larger breakpoints as needed. The committed `tokens/tokens.css` currently takes
the opposite approach for the type scale: it declares desktop sizes as the base and
overrides them with `@media (max-width: 1023px)` and `@media (max-width: 639px)`.

## Container and grid

| Property | 1024–1279px | 1280px+ |
|---|---|---|
| Max content width | 1200px | 1280px |
| Page gutter | `space-8` (32px) | `space-8` (32px) |
| Grid | 12 columns | 12 columns |
| Column gap | `space-6` (24px) | `space-6` (24px) |
| Documentation prose width | 720px max | 720px max |

Center the container (`margin-inline: auto`). Backgrounds extend full-bleed; content stays in the container.

## Page templates

**Website (discovery):** Navbar (64px) → hero (Display, 80px vertical padding `space-20`) → search → filters + results.
- Bot grid: 3 columns (4 on wide when the sidebar filter is hidden), gap `space-6`.
- Filter rail (optional): 256px left column, `bg-surface` panel, sticky under the navbar (`top: 64px + space-6`).

**Dashboard:** Sidebar (256px, collapsible to 72px) + content area.
- Content max width 1200px inside the remaining space; padding `space-8`.
- Page header: Breadcrumbs → H1 + actions (Primary on the right) → Tabs.
- Two-column detail pages: main (8 columns) + aside (4 columns).

**Documentation:** Sidebar (256px) · content (≤ 720px) · "On this page" rail (200px, sticky). Content uses Body and H2/H3 hierarchy.

## Spacing

| Context | Token |
|---|---|
| Between page sections | `space-16` (64px); marketing sections `space-20` (80px) |
| Between a section heading and content | `space-6` (24px) |
| Between cards in a grid | `space-6` (24px) |
| Card internal padding | `space-6` (24px) |
| Form field vertical gap | `space-5` (20px) |
| Dialog padding | `space-6` (24px) |

## Typography

Display 56/60 · H1 36/44 · H2 28/36 · H3 20/28 · Body 16/24 · Small 14/20 · Caption 12/16. Headings use `text-wrap: balance`.

## Navigation behavior

- Navbar shows all primary links inline; global search visible (≥ 240px wide); user menu is a dropdown.
- Sidebar is persistent; collapsible with a toggle (state remembered). Collapsed items show tooltips.
- Breadcrumbs show the full path.
- Tabs show all items inline.
- Keyboard shortcuts (`/` search, `g` + key navigation) are optional and must never be required.

## Component adaptations

| Component | Desktop behavior |
|---|---|
| Buttons | `md` (40px) default; `sm` allowed in tables/toolbars |
| Bot Card | 3-column grid, hover state enabled |
| Inputs | 40px, labels above, inline help |
| Dialogs | Centered modal 480–560px with scrim; popovers anchored; tooltips on hover and focus |
| Dropdown / Select | Anchored menus, 32px dense items allowed |
| Tables | Full columns, row hover (`overlay-hover`), sticky header (`z-sticky`) |
| Toasts | Bottom-right, 360px |
| Pagination | Full numbered list |

## Pointer and keyboard

Hover states are enabled (`@media (hover: hover)`); all hover-revealed content is also reachable by focus. Focus rings are always visible for keyboard users.
