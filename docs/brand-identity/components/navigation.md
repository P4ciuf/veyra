# Navigation

Related: [Desktop](../layouts/desktop.md) · [Tablet](../layouts/tablet.md) · [Mobile](../layouts/mobile.md) · [Buttons](buttons.md)

All navigation items are links or buttons with a visible text label (icons are never the only label except for a collapsed sidebar, which provides tooltips and accessible names).

## Navbar

**Purpose:** global top-level navigation for the website and dashboard.

| Property | Value |
|---|---|
| Height | 64px desktop (`navbar-height-desktop`), 56px mobile |
| Background | `bg-app` (website) or `bg-surface` (dashboard); 1px bottom `border-default` |
| Position | Sticky, `z-sticky`; `shadow-1` appears after scrolling |
| Layout | Logo (see [logo usage](../brand/logo-usage.md)) · primary links · search · actions (Sign in, theme) |
| Container | Same container as page content; gutter per breakpoint |
| Link | Label 14/20 · 500, `text-secondary`; padding `space-3` × `space-2`; `radius-md` |
| Gaps | `space-1` between links; `space-6` between groups |
| Mobile | Logo + search icon + menu button; links move into a drawer (see [mobile](../layouts/mobile.md)) |

| State | Link specification |
|---|---|
| **Default** | text `text-secondary` |
| **Hover** | text `text-primary`, bg `overlay-hover` |
| **Active (current page)** | text `text-primary`, 2px bottom indicator using `--vy-gradient-brand` (the single permitted gradient here), `aria-current="page"` |
| **Pressed** | bg `overlay-active` |
| **Focus-visible** | 2px `focus-ring` outline, offset 2px |
| **Disabled** | text `text-disabled`, `aria-disabled="true"` |
| **Loading** | Not applicable to links; for the user menu, avatar replaced by a skeleton circle |

Skip link: a visually hidden "Skip to main content" link is the first focusable element; on focus it appears at top-left on `bg-elevated` with a focus ring.

## Sidebar

**Purpose:** dashboard navigation (My bots, Servers, Configuration, Testing, Hosting, Settings).

| Property | Value |
|---|---|
| Width | 256px expanded (`width-expanded`), 72px collapsed (`width-collapsed`); drawer on mobile |
| Background | `bg-surface`; 1px right `border-default` |
| Padding | `space-4` (16px) container; `space-1` between items |
| Group heading | Caption (12/16 · 500), `text-muted`, `space-3` padding, `space-4` above group |
| Item | Height 40px, padding `space-3`, `radius-md`, Label 14/20 · 500, icon `icon-md` + `space-3` gap, optional trailing count (Caption mono) |

| State | Item specification |
|---|---|
| **Default** | text `text-secondary`, icon `text-muted` |
| **Hover** | bg `overlay-hover`, text `text-primary` |
| **Active (current)** | bg `action-primary-subtle`, text `text-primary`, icon `accent`, 3px left indicator bar `action-primary`, `aria-current="page"` |
| **Pressed** | bg `overlay-active` |
| **Focus-visible** | 2px `focus-ring` outline, offset −2px (inside, so it is not clipped by the scroll container) |
| **Disabled** | text/icon `text-disabled`, `aria-disabled="true"` |
| **Loading** | Item label replaced by a skeleton bar; count replaced by spinner |

Collapsed mode: icons only, each with an accessible name and a [tooltip](dialogs.md#tooltip) on hover/focus. Collapse toggle is a button with `aria-expanded` and `aria-label`. State persists across sessions.

## Breadcrumbs

| Property | Value |
|---|---|
| Markup | `<nav aria-label="Breadcrumb"><ol>…</ol></nav>` |
| Typography | Small (14/20 · 400) |
| Link | `text-secondary`, underline on hover |
| Separator | Chevron-right 16px, `text-muted`, `aria-hidden`, `space-2` margins |
| Current | `text-primary`, not a link, `aria-current="page"` |

| State | Specification |
|---|---|
| **Default** | Link `text-secondary` |
| **Hover** | `text-primary` + underline (non-color cue) |
| **Active** | `text-primary`, underline |
| **Focus-visible** | 2px `focus-ring` outline, `radius-sm`, offset 2px |
| **Disabled** | Not used; unavailable ancestors are rendered as plain text |
| **Loading** | Skeleton bars of expected length |

Mobile: show only the parent link with a back chevron ("‹ Bots") or collapse middle items into an "…" menu.

## Tabs

| Property | Value |
|---|---|
| Markup | `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby` |
| Tab | Height 40px, padding `space-4` inline, Label 14/20 · 500 |
| List | 1px bottom `border-default`; tabs gap `space-1` |
| Overflow | Horizontal scroll with edge fade (no wrapping); selected tab scrolled into view |

| State | Specification |
|---|---|
| **Default** | text `text-secondary` |
| **Hover** | text `text-primary`, bg `overlay-hover` (top radius `radius-md`) |
| **Active (selected)** | text `text-primary`, 2px bottom indicator `action-primary` (3.95:1 on Background; ≥ 3:1) |
| **Pressed** | bg `overlay-active` |
| **Focus-visible** | 2px `focus-ring` outline, offset −2px |
| **Disabled** | text `text-disabled`, `aria-disabled="true"`, skipped by arrow keys (still discoverable) |
| **Loading** | Panel shows skeleton; tab remains selected with `aria-busy` on the panel |

Keyboard: roving `tabindex` (selected tab = 0). ←/→ moves between tabs, Home/End jump, automatic activation unless the panel is expensive to load (then Enter/Space). Tab key moves into the panel.

## Pagination

| Property | Value |
|---|---|
| Markup | `<nav aria-label="Pagination"><ul>…</ul></nav>` |
| Item | 40×40px (44px on touch), `radius-md`, Label 14/20 · 500, tabular numbers |
| Gap | `space-1` |
| Prev / Next | Ghost buttons with text and chevron ("Previous", "Next"); icon-only on mobile with `aria-label` |
| Ellipsis | `text-muted`, not focusable |

| State | Specification |
|---|---|
| **Default** | text `text-secondary`, transparent |
| **Hover** | bg `overlay-hover`, text `text-primary` |
| **Active (current page)** | bg `action-primary-subtle`, 1px border `action-primary`, text `text-primary`, `aria-current="page"` |
| **Pressed** | bg `overlay-active` |
| **Focus-visible** | 2px `focus-ring` outline, offset 2px |
| **Disabled** | Prev on first / Next on last: text `text-disabled`, `aria-disabled="true"` |
| **Loading** | List `aria-busy="true"`, items non-interactive at 60% opacity; keep current item border |

Mobile: compact form "Page 3 of 12" (Small, `text-secondary`) with Previous/Next. Moving page moves focus to the results heading and announces "Page 3 of 12, 24 results" in a live region.

## Accessibility (all navigation)

- Landmarks: `<header>`, `<nav aria-label>` (labeled uniquely when more than one), `<main>`, `<aside>`.
- `aria-current` marks the current page; selection is also shown by a non-color cue (indicator bar/underline).
- Fully operable by keyboard; logical tab order follows visual order; no keyboard traps in drawers (Esc closes, focus returns to the menu button).
- Touch targets ≥ 44px on touch devices (sidebar/tab/pagination items are 40px on desktop, padded to 44px on touch).
- Reduced motion: drawer and indicator transitions are instant.
