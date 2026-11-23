# Feedback

Related: [Buttons](buttons.md) · [Dialogs](dialogs.md) · [Inputs](inputs.md) · [Cards](cards.md)

Status communication always combines **color + icon + text**. Status colors map to semantic tokens: `success`, `warning`, `danger` (text: `danger-text`), `info` with their `-subtle` and `-border` companions.

| Status | Icon (suggested) | Text color token | Background | Border |
|---|---|---|---|---|
| Success | circle-check | `success` | `success-subtle` | `success-border` |
| Warning | triangle-alert | `warning` | `warning-subtle` | `warning-border` |
| Error / Danger | circle-x / octagon-alert | `danger-text` | `danger-subtle` | `danger-border` |
| Info | info | `info` | `info-subtle` | `info-border` |

## Toast Notifications

**Purpose:** transient confirmation of a result that does not require immediate decisions ("Bot added to server").

| Property | Value |
|---|---|
| Surface | `bg-elevated`, 1px `border-default`, `radius-lg`, `shadow-3`, `z-toast` |
| Layout | 20px status icon (status color) · Title (Label 14/20 · 500) + optional description (Small, `text-secondary`) · optional action (Ghost `sm`) · dismiss (Ghost icon `sm`) |
| Padding | `space-4` (16px); gap `space-3` |
| Width | 360px (max 420px); mobile `100vw − 2 × space-4` |
| Position | Desktop: bottom-right, `space-6` from edges. Mobile: top, below the navbar (never covering primary actions or the keyboard) |
| Stack | Max 3 visible, `space-3` gap; newest nearest the edge |
| Duration | Info/success 5s; with an action 8s; **error and warning persist until dismissed** |

| State | Specification |
|---|---|
| **Default** | As above; enters with `motion-slow` (slide 8px + fade) |
| **Hover** | Auto-dismiss timer pauses; dismiss button visible |
| **Active** | Pressed controls follow their button specs |
| **Focus-visible** | Focus on action or dismiss shows 2px `focus-ring`; timer pauses while any child is focused |
| **Disabled** | Not applicable |
| **Loading** | Persistent toast with spinner icon and text ("Publishing bot…"), no auto-dismiss; replaced by a success/error toast on completion |

Accessibility: container `role="region" aria-label="Notifications"`; success/info toasts `role="status"` (`aria-live="polite"`); error toasts `role="alert"` (`aria-live="assertive"`). Toasts are never the only way to learn about an error that needs correction — also show it inline. Reachable by keyboard (hotkey F6 or a "Notifications" shortcut). Reduced motion: fade only.

## Alerts

**Purpose:** persistent, inline messages tied to a page or section (maintenance, deprecation, validation summary).

| Property | Value |
|---|---|
| Container | Status `-subtle` bg, 1px status `-border`, `radius-md` (10px), padding `space-4` |
| Layout | 20px icon · Title (Label 14/20 · 500, `text-primary`) · description (Small, `text-secondary`) · optional actions (Secondary `sm` / link) · optional dismiss |
| Variants | Info, Success, Warning, Danger |
| Width | Fills its column; max readable width 720px |

| State | Specification |
|---|---|
| **Default** | As above |
| **Hover** | None (non-interactive container) |
| **Active** | Inner controls only |
| **Focus-visible** | Inner links, buttons and dismiss show 2px `focus-ring` |
| **Disabled** | Not applicable |
| **Loading** | Info alert with spinner icon for in-progress operations; `role="status"` |

Accessibility: `role="status"` for info/success; `role="alert"` for danger when inserted dynamically; static alerts need no role. Title text is `text-primary` (not status color) so contrast stays ≥ 13:1; the icon and border carry the status color alongside the status word in the title ("Error:", "Warning:" when helpful).

## Success States

Section- or page-level confirmation of a completed task ("Bot published").

- Layout: centered 48px circle (`success-subtle` bg) with a 24px check icon (`success`); H3 title; Small `text-secondary` description (max-width 400px); Primary next action + optional Secondary.
- State specs: **Default** as above; **Hover/Active/Focus-visible/Disabled/Loading** apply to the action buttons per [buttons](buttons.md). Move focus to the title (`tabindex="-1"`) after completing a flow, and announce via `role="status"`.
- Copy states what happened and what to do next, with no celebration or emoji.

## Error States

Page- or section-level failure (failed to load bots, 404, 500, permission denied).

- Layout: 48px circle (`danger-subtle`) with a 24px alert icon (`danger-text`); H3 title; description with the cause and fix; **Retry** (Primary) and a secondary route ("Go to dashboard"); optional error code in Geist Mono Caption with a Copy button.
- Field errors: see [inputs](inputs.md) (icon + `danger-text` message + `aria-invalid`).
- State specs: Retry button loading state shows spinner while retrying; focus moves to the heading on route-level errors.
- Never blame the user; never show raw stack traces. Provide a diagnostic ID for support.

## Warning States

Cautions that do not block the task (deprecated bot, near rate limit, unsaved changes).

- Layout: inline [Alert](#alerts) (Warning) or banner at the top of the section. For deprecated bots, a Warning alert at the top of the bot page links to the recommended replacement.
- Blocking warnings (data loss) use a [Confirmation Dialog](dialogs.md#confirmation-dialog).
- Icon is `triangle-alert` (shape differs from error) with `warning`; text label always says what is wrong.

## Empty States

Shown when a list or view has no content.

| Property | Value |
|---|---|
| Container | Centered, max-width 400px, vertical padding `space-16` (64px) desktop / `space-10` mobile |
| Visual | 64px icon (`text-muted`) in a 96px `radius-xl` `bg-elevated` tile, or a geometric line illustration; may include **one** brand-gradient accent |
| Title | H3 |
| Description | Small, `text-secondary` |
| Actions | One Primary action (or Secondary if the page already has Primary) + optional link |

Variants: **First use** (invite to act: "Add your first bot"), **No results** (echo the query; suggest clearing filters; Secondary "Clear filters"), **Error/offline** (see Error States), **Permission** (explain and link to request access).

| State | Specification |
|---|---|
| **Default** | As above |
| **Hover / Active / Focus-visible / Disabled** | Apply to actions via [buttons](buttons.md) |
| **Loading** | Do not flash an empty state while loading; show [skeletons](#loading-skeletons) first |

## Loading Skeletons

**Purpose:** placeholder for content with a known shape while loading (Bot Cards, table rows, text).

| Property | Value |
|---|---|
| Block color | `bg-elevated` on `bg-surface`; `bg-surface` on `bg-app` |
| Radius | Matches the element it stands in for (`radius-sm` text lines, `radius-lg` icons, `radius-full` avatars) |
| Text lines | 12–16px tall, last line 60% width; `space-2` gap |
| Shimmer | A soft `overlay-hover` highlight sweeping left→right, 1.6s linear infinite |
| Dimensions | Match the real content to prevent layout shift |

| State | Specification |
|---|---|
| **Default** | Static blocks with shimmer |
| **Hover / Active / Focus-visible** | Not interactive and not focusable |
| **Disabled** | Not applicable |
| **Loading** | This *is* the loading state; show after a 150ms delay and keep for ≥ 300ms to avoid flicker |

Accessibility: container has `aria-busy="true"`; include one visually hidden "Loading bots…" text in a `role="status"` region; skeleton elements are `aria-hidden="true"`. **Reduced motion:** disable shimmer; use static blocks.

## Spinners

**Purpose:** indeterminate progress for short actions (< 10s) inside buttons, inputs, menus and small regions. For known progress or longer waits use a progress bar with text.

| Size | Diameter | Stroke | Used in |
|---|---|---|---|
| sm | `icon-sm` 16px | 2px | Inline, inputs |
| md | `icon-md` 20px | 2px | Buttons, menus |
| lg | `icon-lg` 24px | 2.5px | Cards, alerts |
| xl | 32px | 3px | Page/section loading |

| Property | Value |
|---|---|
| Track | `overlay-active` (or `border-default`) ring |
| Head | 25% arc in `accent` (on neutral surfaces), `action-primary-text` on Primary/Destructive buttons, `text-secondary` on Secondary/Ghost |
| Animation | 800ms linear infinite rotation |
| Radius | `radius-full` |

| State | Specification |
|---|---|
| **Default** | Spinning |
| **Hover / Active / Focus-visible / Disabled** | Not interactive |
| **Loading** | This *is* the loading state; show after a 150ms delay |

Accessibility: standalone spinners have `role="status"` and visible or visually hidden text ("Loading"). Spinners inside a button rely on the button's `aria-busy` and an unchanged label. **Reduced motion:** replace rotation with a 1.2s opacity pulse or a static "Loading…" label; never stop with no indication.

## Accessibility (all feedback)

- Status is shown with icon + text + color; never color alone.
- Live regions: polite for success/info, assertive only for errors that interrupt the user.
- Time limits: nothing essential disappears automatically; errors persist.
- Contrast: all status text ≥ 4.5:1 on the surface it appears on (verified in [brand guidelines](../brand/brand-guidelines.md#44-verified-contrast-dark-theme)).
- Focus management: after a route-level success/error/empty state, move focus to its heading.
- Reduced motion: all animation (toast slide, shimmer, spinner rotation) has a non-motion fallback.
