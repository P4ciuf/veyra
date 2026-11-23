# Dialogs

Related: [Buttons](buttons.md) · [Feedback](feedback.md) · [Inputs](inputs.md) · [Mobile layout](../layouts/mobile.md)

## Shared properties

| Property | Value |
|---|---|
| Surface | `bg-elevated` (#242834) |
| Border | 1px `border-default` |
| Radius | Modal `radius-xl` (20px); Menu/Popover `radius-lg` (14px); Tooltip `radius-sm` (6px) |
| Shadow | Modal `shadow-4`; Menu/Popover `shadow-2`; Tooltip `shadow-2` |
| z-index | Tooltip/popover `z-popover` (300); scrim `z-overlay` (400); modal `z-modal` (500) |
| Enter motion | `motion-slow` for modals (fade + 2% scale); `motion-base` for menus/popovers/tooltips (fade + 4px translate) |
| Reduced motion | Fade only, duration 0 |

## Modal

**Purpose:** focused task that requires the user's attention and blocks the page (edit bot config, add server, publish).

| Property | Value |
|---|---|
| Scrim | `scrim` (rgba(5,6,9,.72)); click on scrim closes (unless unsaved changes) |
| Width | 480px default, 560px large, max `100vw − 2 × space-4`; mobile becomes a bottom sheet |
| Padding | `space-6` (24px); mobile `space-5` |
| Title | H3 (20/28 · 600); `aria-labelledby` |
| Description | Small (14/20), `text-secondary`, `aria-describedby` |
| Close | Ghost icon button (40px) top-right, `aria-label="Close"` |
| Footer | Buttons right-aligned, gap `space-3`, Primary last; separated from body by `space-6` |
| Body scroll | Body scrolls inside the modal; header and footer stay visible if content exceeds 90vh |

| State | Specification |
|---|---|
| **Default** | As above, focus moves to first focusable element (or the title if the first control is destructive/far down) |
| **Hover** | Applies only to inner controls |
| **Active** | Applies only to inner controls |
| **Focus-visible** | Inner controls show rings; the dialog container has `tabindex="-1"` and no ring |
| **Disabled** | Controls inside follow their specs; while submitting, footer buttons disabled and dialog cannot be dismissed with scrim click |
| **Loading** | Primary button shows its loading state; body may show skeletons; `aria-busy="true"` on the dialog |

Behavior: `role="dialog"` + `aria-modal="true"`; focus is trapped; background is `inert`; Esc closes; focus returns to the trigger; page scroll is locked. Do not open a modal from a modal.

## Confirmation Dialog

**Purpose:** confirm destructive or irreversible actions. Uses `role="alertdialog"`.

| Property | Value |
|---|---|
| Width | 400px |
| Icon | Optional 24px status icon in a 40px `radius-full` badge (`danger-subtle` bg, `danger-text` icon) |
| Title | H3, states the action and object: "Delete bot ‘Moderator’?" |
| Body | Small: states consequences ("This removes the bot from 12 servers. This can't be undone.") |
| Actions | **Cancel** (Secondary) + **confirming verb** (Destructive for deletions, Primary otherwise). Never "Yes/No/OK" |
| High-risk | Require typing the resource name in a text input to enable the Destructive button |

| State | Specification |
|---|---|
| **Default** | Initial focus on **Cancel** (safe default) |
| **Hover / Active** | Per button specs |
| **Focus-visible** | Per button specs; focus trapped between Cancel and confirm |
| **Disabled** | Destructive confirm disabled until the typed name matches (when required), with helper text |
| **Loading** | Destructive button in loading state; Cancel disabled; Esc ignored until finished; on error, show an inline [alert](feedback.md#alerts) in the dialog |

## Dropdown Menu

**Purpose:** list of actions attached to a trigger (row actions, user menu, "More").

| Property | Value |
|---|---|
| Container | `bg-elevated`, 1px `border-default`, `radius-lg`, `shadow-2`, padding `space-1`, min-width 200px, max-height 320px (scroll) |
| Item | Height 40px (32px dense desktop), padding `space-3`, `radius-md`, Label 14/20 · 500, icon `icon-md` `text-muted` + `space-3` gap, shortcut hint Caption mono `text-muted` right-aligned |
| Separator | 1px `border-default`, `space-1` vertical margin |
| Group label | Caption, `text-muted`, `space-3` padding |
| Destructive item | text `danger-text`, icon `danger-text`, hover bg `danger-subtle` |
| Offset | `space-1` (4px) from trigger |

| State | Item specification |
|---|---|
| **Default** | text `text-primary` |
| **Hover** | bg `overlay-hover` |
| **Active** | bg `overlay-active` |
| **Focus-visible** (keyboard highlight) | bg `overlay-active` **and** 2px `focus-ring` inset outline (offset −2px) |
| **Disabled** | text `text-disabled`, `aria-disabled="true"` |
| **Loading** | Item shows an inline spinner in place of the icon; menu stays open until complete or closes with a toast |

Markup: trigger `aria-haspopup="menu"` `aria-expanded`; container `role="menu"`; items `role="menuitem"` (`menuitemcheckbox`/`menuitemradio` for toggles). Keys: Enter/Space/↓ opens; ↑/↓ moves; Home/End; type-ahead; Esc closes and returns focus to trigger; Tab closes. Selected/checked items show a check icon (not color only).

## Popover

**Purpose:** non-modal rich content tied to a trigger (help, quick settings, +N badges list).

| Property | Value |
|---|---|
| Container | `bg-elevated`, 1px `border-default`, `radius-lg`, `shadow-2`, padding `space-4`, width 240–360px |
| Title | Label 14/20 · 500 |
| Body | Small 14/20, `text-secondary` |
| Arrow | Optional 8px, same fill/border |
| Placement | Preferred bottom; flips to stay in viewport; offset `space-2` |

| State | Specification |
|---|---|
| **Default** | Opens on click/Enter/Space of trigger (not hover only) |
| **Hover / Active** | Inner controls only |
| **Focus-visible** | Focus moves into the popover when it has interactive content; inner controls show rings |
| **Disabled** | Disabled trigger = no popover; the trigger follows button disabled spec |
| **Loading** | Skeleton content; `aria-busy="true"` |

Markup: trigger `aria-expanded` + `aria-controls`; container `role="dialog"` (non-modal, no `aria-modal`) with `aria-label`. Esc closes and restores focus; click outside closes. On mobile, popovers with interactive content become a bottom sheet.

## Tooltip

**Purpose:** short, supplementary label for icon buttons and truncated text. Never the only place for essential information or interactive content.

| Property | Value |
|---|---|
| Container | `bg-elevated`, 1px `border-default`, `radius-sm`, `shadow-2`, padding `space-1` × `space-2` |
| Text | Small (14/20 · 400) or Caption (12/16 · 500) for single words, `text-primary`, max-width 240px |
| Delay | Show 400ms after hover, immediately on keyboard focus; hide 100ms after leave |
| Placement | Top by default, flips automatically; `space-2` offset |

| State | Specification |
|---|---|
| **Default** | Hidden |
| **Hover** | Trigger hover shows; hovering the tooltip itself keeps it visible (WCAG 1.4.13) |
| **Active** | Press/click on trigger does not dismiss unless the trigger action occurs |
| **Focus-visible** | Keyboard focus on trigger shows the tooltip; trigger shows its own ring |
| **Disabled** | A disabled trigger that needs an explanation uses `aria-disabled` (still focusable) so the tooltip can appear |
| **Loading** | Not applicable |

Markup: `role="tooltip"`, trigger `aria-describedby` (or `aria-labelledby` for icon-only buttons with no other label). Esc dismisses. Not shown on touch: convey the information with visible text or a popover instead.

## Accessibility (all dialogs)

- Modals: focus trap, `inert` background, Esc, return focus, accessible name and description.
- Menus: full arrow-key and type-ahead support; focus managed with roving tabindex or `aria-activedescendant`.
- All transient content is dismissible (Esc), hoverable and persistent until dismissed (WCAG 1.4.13).
- Text ≥ 4.5:1 on `bg-elevated` (Text Primary 13.38:1, Secondary 8.64:1, Muted 4.93:1).
- Do not auto-dismiss dialogs or popovers with timers.
- Reduced motion: no scale/translate; opacity changes happen instantly.
