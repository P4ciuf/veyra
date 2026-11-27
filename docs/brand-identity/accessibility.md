# Veyra Accessibility Guidelines

Target: **WCAG 2.2 Level AA** across website, dashboard, documentation and community platforms.

Related: [README](README.md) · [Brand guidelines](brand/brand-guidelines.md#44-verified-contrast-dark-theme) · [Components](components/buttons.md)

## 1. Keyboard navigation

- Every interactive element is reachable and operable with the keyboard alone, in an order that matches the visual order.
- Standard keys: Tab / Shift+Tab (move), Enter/Space (activate), Esc (close/cancel), arrow keys inside composite widgets (tabs, menus, selects, radio groups), Home/End for first/last.
- No keyboard traps. Modals and drawers trap focus **intentionally**, close with Esc, and return focus to the trigger.
- A "Skip to main content" link is the first focusable element on every page.
- Single-character shortcuts (such as `/` to search) must be disabled while typing in fields and must be discoverable.

## 2. Visible focus

- All focusable elements show a focus indicator on `:focus-visible`: `outline: 2px solid var(--vy-focus-ring); outline-offset: 2px`.
- Focus ring color is Accent `#A78BFA` (dark: 6.83:1 on Background, 6.12:1 on Surface, 5.40:1 on Elevated) and `#5B3FE0` (light). The ring must always be ≥ 3:1 against adjacent colors.
- Never `outline: none` without an equivalent replacement. Use `:focus-visible` (not `:focus`) so mouse clicks do not show rings, keyboard use always does.
- Where a parent clips overflow, use an inset ring (negative `outline-offset`). `tokens/shadows.json` defines a `focus-ring` box-shadow value for this case, but `tokens/tokens.css` currently emits only the `--vy-focus-ring` color, not a shadow custom property.

## 3. Contrast

| Content | Minimum | Veyra implementation |
|---|---|---|
| Body and small text | 4.5:1 | Text Primary/Secondary/Muted all ≥ 4.93:1 on every dark surface |
| Large text (≥ 24px, or ≥ 18.66px bold) | 3:1 | Headings use Text Primary |
| UI components and graphics (borders of controls, icons, focus ring) | 3:1 | `border-strong` `#737889` (3.79:1 on Surface) instead of `border-default` |
| Text on Primary fills | 4.5:1 | White `#FFFFFF` on `#7657F6` = 4.70:1 |
| Text on destructive fills | 4.5:1 | White on `#DC2626` = 4.83:1 |

Do not use Primary `#7657F6` for body-size text on dark (3.13–3.95:1); use Accent. Do not place text over the brand gradient unless that exact pair is verified. The light theme was designed with its own AA-verified tokens (see `colors.json`).

## 4. Labels and names

- Every form control has a visible, programmatically associated `<label>`; placeholders are never the only label.
- Icon-only controls have an accessible name (`aria-label`/visually hidden text) and, where useful, a tooltip.
- Links and buttons are named by their purpose out of context ("Add Moderator to server", not "Click here").
- Images are meaningful (`alt` describes function) or decorative (`alt=""`). The logo is `alt="Veyra"` unless the name is adjacent.
- Pages have one `<h1>` and non-skipping heading levels; landmarks (`header`, `nav`, `main`, `aside`, `footer`) are used and labeled when repeated.

## 5. Semantics and component behavior

| Component | Pattern |
|---|---|
| Button / link | `<button>` for actions, `<a href>` for navigation |
| Tabs | `tablist`/`tab`/`tabpanel`, roving tabindex |
| Menu | `menu`/`menuitem`, `aria-haspopup`, `aria-expanded` |
| Modal | `dialog`/`alertdialog`, `aria-modal`, focus trap, labelled |
| Switch | `role="switch"` + `aria-checked` |
| Tooltip | `role="tooltip"` + `aria-describedby` |
| Toast / alert | `role="status"` (polite) / `role="alert"` (assertive) |
| Navigation current item | `aria-current="page"` |
| Loading regions | `aria-busy="true"` + a status message |
| Form errors | `aria-invalid`, `aria-describedby`, error summary |

Prefer native HTML elements; add ARIA only when native semantics are insufficient. Component specs in [`components/`](components/) list the exact requirements.

## 6. Reduced motion

- Honor `@media (prefers-reduced-motion: reduce)`: in `tokens/tokens.css` the `--vy-motion-*` variables become `0ms`, while the blanket rule sets `animation-duration` and `transition-duration` to `0.01ms !important` (see `tokens/motion.json` and the bottom of `tokens/tokens.css`).
- Replace spinner rotation with an opacity pulse or static text, disable skeleton shimmer, remove scale/translate on dialogs, toasts and drawers.
- Nothing flashes more than three times per second. No autoplaying motion longer than 5 seconds without a pause control.

## 7. Never color alone

| Information | Non-color cue |
|---|---|
| Status (success, warning, error, info) | Icon shape + text label |
| Required field | `*` and `required` |
| Selected / current | Indicator bar, underline, check icon, `aria-current` |
| Links in body text | Underline |
| Switch on/off | Thumb position + check icon |
| Validation rule met/not met | Check/cross icon + text |
| Charts | Patterns, direct labels or shape markers in addition to hue |

## 8. Touch and pointer

- Interactive targets ≥ 44×44px on touch (minimum 24×24px with spacing at any size, WCAG 2.5.8).
- ≥ 8px between adjacent targets.
- Alternatives to drag, swipe and path-based gestures (WCAG 2.5.7).
- Hover/focus-triggered content is dismissible, hoverable and persistent (WCAG 1.4.13).

## 9. Content and zoom

- Text resizes to 200% and the layout reflows at 320 CSS px without two-dimensional scrolling (except data tables and code).
- Use `rem` for type and spacing; minimum body size 16px.
- Language set on `<html lang>`; text spacing overrides must not break the layout.
- Errors are specific and constructive. Don't use time limits, and if unavoidable offer extension.

## 10. Testing checklist

- [ ] Keyboard-only walkthrough of every flow
- [ ] Visible focus on each interactive element
- [ ] axe / Lighthouse with zero critical issues
- [ ] Screen reader smoke test (VoiceOver + NVDA)
- [ ] 200% zoom and 320px width
- [ ] `prefers-reduced-motion: reduce`
- [ ] Contrast check for any new color pair
- [ ] Grayscale pass (is every state still distinguishable?)
