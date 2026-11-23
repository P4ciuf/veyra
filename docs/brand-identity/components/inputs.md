# Inputs

Related: [Buttons](buttons.md) · [Feedback](feedback.md) · [Dialogs](dialogs.md) · [Mobile layout](../layouts/mobile.md)

## Shared field anatomy

```
Label *                          ← Label style (14/20 · 500), text-primary
[ control ]                      ← 40px (48px on mobile)
Help text or error message       ← Small (14/20), text-muted / danger-text
```

| Property | Value |
|---|---|
| Control height | `control-md` 40px; `control-lg` 48px on mobile (also prevents iOS zoom, with 16px text) |
| Padding (inline) | `space-3` (12px) |
| Background | `bg-app` (#111318): inset on Surface panels; border carries the shape on the page |
| Border | 1px `border-strong` (#737889, ≥ 3:1) |
| Radius | `radius-md` (10px) |
| Text | Body (16/24 · 400), `text-primary`; value in Geist Mono for tokens/IDs |
| Placeholder | `text-muted` (6.23:1). Placeholders are hints, never labels |
| Label gap | `space-2` (8px) above control; help text `space-2` below |
| Required | Label ends with `*` **and** the control has `required`; "(optional)" is written for optional fields in mostly-required forms |

**Shared states (text-like controls):**

| State | Specification |
|---|---|
| **Default** | `bg-app`, border `border-strong` |
| **Hover** | Border `text-muted` (#9295A1) |
| **Active / editing** | Border `focus-ring`; same as Focus-visible |
| **Focus-visible** | Border `focus-ring` **and** `outline: 2px solid var(--vy-focus-ring); outline-offset: 2px` |
| **Disabled** | bg `state-disabled-bg`, border `border-default`, text `text-disabled`, `cursor: not-allowed` |
| **Loading** | Spinner (`icon-md`, `text-muted`) at the trailing edge; field stays focusable; `aria-busy="true"` |
| **Error** | Border `danger`, 2px; leading/trailing error icon; message in `danger-text` with icon below; `aria-invalid="true"` + `aria-describedby` pointing at the message |
| **Read-only** | bg `bg-surface`, border `border-default`, text `text-secondary`; focusable, selectable |

## Text Input

`<input type="text|email|url|number">`. Use correct `type`, `autocomplete`, and `inputmode`. Optional leading icon (`icon-md`, `text-muted`) inside `space-3` padding; trailing slot for clear/status icons.

## Search Input

| Property | Value |
|---|---|
| Element | `<input type="search">` inside `<form role="search">` (or `role="search"` wrapper) |
| Leading icon | Search, `icon-md`, `text-muted`, decorative |
| Trailing | Clear button (Ghost icon `sm`, `aria-label="Clear search"`) when non-empty; keyboard hint `/` as Caption mono in a `radius-sm` `border-default` chip (desktop only) |
| Radius | `radius-md` (use `radius-full` only for the global navbar search) |

Behavior: Escape clears; `/` focuses it (not while typing in another field); results update via a polite live region ("24 bots found"). Loading: spinner replaces the clear button. Empty results use the [empty state](feedback.md#empty-states).

## Password Input

Text input with `type="password"`, `autocomplete="current-password"` / `"new-password"`. Trailing **Show/Hide** toggle: Ghost icon button, `aria-label="Show password"`/`"Hide password"`, `aria-pressed`. Never block paste. For new passwords show requirements as text below the field before the user types, with check/cross icons **and** text per rule (not color alone). Do not announce the password value.

## Textarea

Same as Text Input, `min-height: 96px` (`space-12` × 2), `padding: space-3`, vertical resize only, Body 16/24. Optional character counter bottom-right: Caption mono, `text-muted`; turns `warning` (with text "20 characters left") near the limit and `danger-text` over it. Counter announces via `aria-live="polite"` only at thresholds.

## Select

| Property | Value |
|---|---|
| Trigger | As Text Input; trailing chevron `icon-md`, `text-muted` |
| Native vs custom | **Mobile: native `<select>`** (best OS UX). Desktop: native by default; custom listbox only when options need rich content |
| Menu (custom) | bg `bg-elevated`, 1px `border-default`, `radius-lg`, `shadow-2`, padding `space-1`, max-height 320px, `z-dropdown` |
| Option | Height 40px, padding `space-3`, `radius-md`, Body 16 (Small 14 on dense) |
| Option hover/focus | bg `overlay-hover`; keyboard-active option bg `overlay-active` |
| Selected option | Trailing check icon + `action-primary-subtle` bg + `text-primary` |
| Disabled option | `text-disabled`, `aria-disabled`, not skipped by screen readers |

Custom select follows the ARIA combobox/listbox pattern: `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-activedescendant`; ↑/↓ moves, Home/End, type-ahead, Enter selects, Esc closes and returns focus. Loading (async options): spinner in trigger and an "Loading…" row in the menu.

## Checkbox

| Property | Value |
|---|---|
| Box | 20×20px, `radius-sm` (6px), 2px border `border-strong`, bg `bg-app` |
| Label | Body 16/24 (Small 14 dense), `text-primary`; clickable; `space-3` gap |
| Hit area | Row ≥ 44px tall on touch |
| Checked | bg `action-primary`, border `action-primary`, check icon `action-primary-text` |
| Indeterminate | Same fill with a dash icon, `aria-checked="mixed"` |

| State | Specification |
|---|---|
| **Default** | Unchecked box as above |
| **Hover** | Border `text-muted`; checked → bg `action-primary-hover` |
| **Active** | Pressed: bg `overlay-active` behind the box (halo), checked → `action-primary-active` |
| **Focus-visible** | Outline 2px `focus-ring`, offset 2px around the box |
| **Disabled** | Box border `border-default`, bg `state-disabled-bg`, label `text-disabled`; checked-disabled keeps the check in `text-disabled` |
| **Loading** | Box replaced by a 20px spinner while a save is in flight; `aria-busy="true"` |
| **Error** | Border `danger` + message below; `aria-invalid` |

Use native `<input type="checkbox">` styled via `appearance: none`. Group related checkboxes in `<fieldset><legend>`.

## Switch

For settings that take effect **immediately** (enable bot, toggle feature). Use a checkbox for settings that need a Save action.

| Property | Value |
|---|---|
| Track | 44×24px, `radius-full` |
| Thumb | 18px circle, `radius-full`, 3px inset, travels 20px, `motion-base` |
| Off | Track `bg-elevated` + 2px `border-strong` border; thumb `text-secondary`; shows no icon |
| On | Track `action-primary`; thumb `action-primary-text` (white); check icon (12px, `action-primary`) inside the thumb so state does not depend on color |
| Label | Body 16/24 or Label 14/20 to the left or right, `space-3` gap; row ≥ 44px |

| State | Specification |
|---|---|
| **Default** | Off or On as above |
| **Hover** | Off: border `text-muted`; On: track `action-primary-hover` |
| **Active** | Thumb widens to 22px (disabled under reduced motion); On: track `action-primary-active` |
| **Focus-visible** | Outline 2px `focus-ring`, offset 2px around the track |
| **Disabled** | Track `state-disabled-bg`, border `border-default`, thumb `text-disabled`; label `text-disabled` |
| **Loading** | Thumb replaced by a small spinner, control non-interactive, `aria-busy="true"`; revert with an error toast on failure |

Markup: `<button role="switch" aria-checked="true|false">` or `<input type="checkbox" role="switch">`. Space/Enter toggles. Screen readers announce "on/off" from `aria-checked`; do not use "enabled/disabled" label text that contradicts it.

## Accessibility (all inputs)

- Every control has a programmatically associated `<label>` (`for`/`id`) — placeholders and `aria-label` alone are not enough for text fields.
- Help and error text linked with `aria-describedby`; errors use `role="alert"` on submit or `aria-live="polite"` for inline validation. Validate on blur or submit, not on every keystroke.
- Error summary at the top of a long form, with links that move focus to each invalid field.
- Error messages say what is wrong and how to fix it, and always include an icon **and** text (not color only).
- Group radios/checkbox sets with `fieldset`/`legend`.
- Visible focus on every control; `border-strong` ensures ≥ 3:1 control boundaries; touch targets ≥ 44px.
- Use correct `autocomplete` values (WCAG 1.3.5) and never disable paste.
- Reduced motion: switch thumb and focus transitions are instant.
