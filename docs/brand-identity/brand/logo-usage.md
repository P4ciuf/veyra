# Veyra Logo Usage

> The official Veyra logo is a supplied image and is the **only** approved version of the brand mark. It is never redrawn, recreated, recolored or re-exported by this design system.

Related: [Brand guidelines](brand-guidelines.md) · [README](../README.md)

---

## 1. Asset

| Property | Value |
|---|---|
| File | `brand/logo.png` |
| Description | Stylized geometric letter "V" in a cyan → blue → violet gradient |
| Background | **Transparent** (RGBA alpha channel; no white matte) |
| Status | Committed source of truth; do not replace or re-export |

The committed file is a 500×500 8-bit RGBA PNG. The visible mark occupies approximately `x=75–425`, `y=115–384`; the rest of the canvas is transparent padding. Do not crop that padding.

## 2. Non-negotiable rules

Never:

1. Redraw, trace, vectorize or recreate the logo.
2. Change the gradient, its colors or its direction.
3. Distort, stretch, skew, rotate or mirror it.
4. Flatten the transparency or add an opaque background color.
5. Recreate the logo as a different file format or remove its alpha channel.
6. Add outlines, glows, drop shadows, bevels or effects.
7. Place text, icons or other elements inside its clear space.
8. Recolor it to a single color, or apply opacity.
9. Create alternate logo concepts, wordmarks or lockups unless supplied by the brand owner.

## 3. Display on each background

The asset has a transparent background, so it can sit directly on the approved Background and Surface colors. Do not add a white tile or any other matte behind it.

| Context | How to display |
|---|---|
| Dark theme (Background `#111318`, Surface `#1B1E27`) | Place directly; the surface shows through the transparent area. Preferred. |
| White or very light surface (light theme, print, docs, README, slides) | Place directly and check contrast; the gradient remains visible without a matte. |
| Photographs, busy imagery, gradients | Not permitted. |
| Colored backgrounds other than the approved theme surfaces | Not permitted. |

```html
<img src="brand/logo.png" alt="Veyra" width="40" height="40">
```

```css
.vy-logo { display: block; height: auto; }
```

## 4. Clear space

Keep an empty margin around the logo image equal to **25% of its rendered height** (`x = 0.25 × height`) on every side. No text, borders, other logos or page edges may enter this area. The asset's transparent padding counts toward the clear space; do not crop it.

| Logo size | Minimum clear space |
|---|---|
| 24px | 6px |
| 32px | 8px |
| 40px | 10px |
| 64px | 16px |
| 96px | 24px |

## 5. Sizing

| Use | Recommended size | Minimum |
|---|---|---|
| Navbar (desktop) | 32–40px high | 24px |
| Navbar (mobile) | 32px high | 24px |
| Sidebar header | 32px | 24px |
| Documentation header | 32px | 24px |
| Auth / landing hero | 64–96px | 48px |
| Favicon / app icon | Use a separately supplied, approved icon file | n/a |
| Open Graph / social card | 160px+ | 96px |

Below 24px the mark loses geometric clarity; do not use the logo below that size. Scale only proportionally (lock aspect ratio). For sharp rendering, supply the logo at 2× the display size and constrain with CSS (`height` only, `width: auto`).

## 6. Pairing with the name

When the name "Veyra" appears beside the logo, set it in Geist Sans, weight 700, Text Primary, with `space-3` (12px) between the logo image and the text, vertically centered. This is typography, not a modified lockup; do not tighten it, outline it, apply the gradient to it, or place it inside the clear space.

## 7. Accessibility

- Logo as link to home: `alt="Veyra"` and the link's accessible name is "Veyra home".
- Logo beside the visible name "Veyra": use `alt=""` to avoid duplicate announcement.
- Purely decorative repeats (watermarks, footers beside the name): `alt=""`.

## 8. Checklist before publishing

- [ ] Image is the supplied file, unmodified.
- [ ] Aspect ratio preserved; no rotation or distortion.
- [ ] Transparency preserved; no background color or matte added.
- [ ] Clear space ≥ 25% of height.
- [ ] Size ≥ 24px high.
- [ ] No effects or overlays.
