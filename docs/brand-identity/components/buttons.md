# Buttons

Related: [Cards](cards.md) · [Inputs](inputs.md) · [Feedback](feedback.md) · [Brand guidelines](../brand/brand-guidelines.md)

All values reference tokens in [`tokens/`](../tokens/) (CSS custom properties are prefixed `--vy-`). Raw hex values are never used in component code.

## Purpose

Buttons trigger actions (submit, add a bot, confirm, delete). Navigation to another page uses a link; a link may be *styled* as a button but remains an `<a>`.

**Hierarchy rule:** at most **one Primary button per view region**. Secondary and Ghost support it. Destructive is only used for irreversible or data-removing actions.

## Variants

| Variant | Use for |
|---|---|
| **Primary** | The single main action: "Add to server", "Save changes", "Publish bot" |
| **Secondary** | Alternative actions: "Configure", "Cancel", "View source" |
| **Ghost** | Low-emphasis, tertiary and toolbar actions: "Copy", "Reset", icon buttons |
| **Destructive** | "Delete bot", "Remove from server", "Revoke token" |

## Anatomy and sizes

| Property | `sm` | `md` (default) | `lg` (default on mobile) |
|---|---|---|---|
| Height | `control-sm` 32px | `control-md` 40px | `control-lg` 48px |
| Padding (inline) | `space-3` 12px | `space-4` 16px | `space-5` 20px |
| Typography | Label 14/20 · 500 | Label 14/20 · 500 | Body 16/24 · 500 |
| Icon size | `icon-sm` 16 | `icon-md` 20 | `icon-md` 20 |
| Icon–label gap | `space-2` 8px | `space-2` 8px | `space-2` 8px |
| Border radius | `radius-md` 10px | `radius-md` 10px | `radius-md` 10px |
| Min width | 64px | 80px | 96px |

`sm` (32px) is for dense desktop tables and toolbars only. On touch devices the interactive area must be ≥ 44px (`touch-target-min`); `sm` buttons get padding that extends the hit area or are replaced by `md`/`lg`.

**Icon-only button:** square (`32 / 40 / 48`), `radius-md`, requires an accessible name (`aria-label` and a tooltip).

## Primary

| Property | Value |
|---|---|
| Background | `action-primary` (#7657F6) |
| Text / icon | `action-primary-text` (#FFFFFF) — 4.70:1 |
| Border | none |

| State | Specification |
|---|---|
| **Default** | bg `action-primary`, text `action-primary-text` |
| **Hover** | bg `action-primary-hover` (#6A4BEF); cursor pointer; `motion-fast` |
| **Active** | bg `action-primary-active` (#5B3FE0); no scale change |
| **Focus-visible** | `outline: 2px solid var(--vy-focus-ring); outline-offset: 2px` (2px gap shows the page background) |
| **Disabled** | bg `state-disabled-bg`, text `text-disabled`, no border; `cursor: not-allowed`; no hover/active |
| **Loading** | Spinner (`on-primary`, `icon-md`) replaces the leading icon (or sits before the label if none); label stays; width fixed to avoid layout shift; `aria-busy="true"`; clicks ignored; bg stays `action-primary` |

## Secondary

| Property | Value |
|---|---|
| Background | transparent |
| Text / icon | `text-primary` |
| Border | 1px `border-strong` |

| State | Specification |
|---|---|
| **Default** | transparent, border `border-strong`, text `text-primary` |
| **Hover** | bg `overlay-hover` |
| **Active** | bg `overlay-active` |
| **Focus-visible** | Same ring as Primary |
| **Disabled** | bg transparent, border `border-default`, text `text-disabled` |
| **Loading** | Spinner in `text-secondary`; label stays; bg `overlay-hover`; `aria-busy="true"` |

## Ghost

| Property | Value |
|---|---|
| Background | transparent |
| Text / icon | `text-secondary` |
| Border | none |

| State | Specification |
|---|---|
| **Default** | transparent, text `text-secondary` |
| **Hover** | bg `overlay-hover`, text `text-primary` |
| **Active** | bg `overlay-active`, text `text-primary` |
| **Focus-visible** | Same ring as Primary |
| **Disabled** | text `text-disabled` |
| **Loading** | Spinner in `text-secondary`; `aria-busy="true"` |

## Destructive

| Property | Value |
|---|---|
| Background | `danger-solid` (#DC2626) |
| Text / icon | `action-primary-text` (#FFFFFF) — 4.83:1 |
| Border | none |

| State | Specification |
|---|---|
| **Default** | bg `danger-solid`, text white |
| **Hover** | bg `danger-solid-hover` |
| **Active** | bg `danger-solid-active` |
| **Focus-visible** | Ring uses `focus-ring` (not red) so focus is identical everywhere |
| **Disabled** | Same as Primary disabled |
| **Loading** | White spinner, label stays, `aria-busy="true"` |

*Low-emphasis destructive* (e.g., "Remove" inside a table row): Ghost button with text `danger-text`, hover bg `danger-subtle`. Always paired with a confirmation dialog for irreversible actions (see [dialogs](dialogs.md)).

## Layout rules

- In a button group, the Primary button is **last** on desktop and **first/top** on mobile (full width stacked). Gap `space-3` (12px).
- Full-width buttons are allowed on mobile and in dialogs/forms.
- Labels are 1–3 words, verb-first, sentence case. No trailing punctuation.
- Do not use gradients on buttons.

## Accessibility

- Use `<button type="button|submit">`. Links that look like buttons stay `<a href>`.
- Prefer the native `disabled` attribute. If a disabled button needs an explanation (tooltip), use `aria-disabled="true"`, block activation in JS, and keep it focusable.
- Loading: set `aria-busy="true"`, keep the accessible name, and announce completion via a live region or toast.
- Icon-only buttons need `aria-label`; toggle buttons use `aria-pressed`.
- Focus indicator ≥ 3:1 against adjacent colors (Accent `#A78BFA` is 6.83:1 on Background); never remove outlines without a replacement.
- Hit area ≥ 44×44px on touch; ≥ 24×24px minimum anywhere (WCAG 2.2 target size).
- Meaning must not depend on color: Destructive is also identified by its label (and trash icon where used).
- Honor `prefers-reduced-motion`: color transitions collapse to instant; spinner follows [feedback spec](feedback.md#spinners).
