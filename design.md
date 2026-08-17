# Auros — Style Reference & Token Specification
> Abyssal terminal with bioluminescent data orbs

**Theme:** dark

Auros operates as an abyssal fintech terminal: near-black teal canvas with bioluminescent data orbs and teal-to-pink light gradients that suggest depth, liquidity, and flow. The interface is sparse and cinematic, relying on a single custom display face (Matter) at medium weight with aggressive negative tracking to create scale without shouting. Color is rationed — achromatic whites and silvers carry almost all content, while the chromatic palette is reserved for atmospheric gradients, card surface differentiation, and one signature pill button that morphs from teal-cyan to lavender-pink. Cards float on subtle teal-tinted surface lifts (16px radius, no shadows) rather than using elevation, so the hierarchy reads as depth-of-water rather than shadow-on-paper. Components feel engineered and instrument-like: uppercase tracked labels, thin geometric arrow icons, large numerical stats in pale pink.

---

## 1. Tokens — Colors & Surfaces

| Name | Value | Token | Role |
| :--- | :--- | :--- | :--- |
| **Liquid Abyss** | `#012624` | `--color-liquid-abyss` | Primary canvas — page background, header, hero, and the dominant dark-teal field. Establishes the deep-water atmosphere |
| **Liquid Deep** | `#011d1c` | `--color-liquid-deep` | Recessed surface level — footer background and deeper card panels. Reads as a half-step darker than the canvas, creating a subtle depth gradient downward |
| **Liquid Kelp** | `#003734` | `--color-liquid-kelp` | Raised card surface and primary button fill — the lifted surface that sits one step above the abyss. Used for feature cards, content panels, and the gradient button's origin point |
| **Liquid Mist** | `#edfffe` | `--color-liquid-mist` | Cool-tinted off-white for emphasized body text, section labels, and warm-light typographic moments. Carries a barely-perceptible cyan whisper that ties body text to the teal atmosphere |
| **Platinum** | `#ffffff` | `--color-platinum` | Pure white for headings, nav items, icon strokes, and high-contrast text. The dominant text color across all heading levels and the primary nav |
| **Silver Mist** | `#bbc7c6` | `--color-silver-mist` | Secondary body text, muted descriptions, and link color in resting state. Carries a faint green undertone that harmonizes with the teal canvas |
| **Ash** | `#f2f2f2` | `--color-ash` | Tertiary text for pull-quotes and testimonial copy. A neutral cool-gray fallback when Silver Mist's teal undertone is too colored |
| **Slate Deep** | `#707777` | `--color-slate-deep` | Subtle surface tint for inactive or low-emphasis backgrounds. Sits between canvas and card for very low-elevation differentiation |
| **Lavender Phosphor** | `#fde9ff` | `--color-lavender-phosphor` | Highlight color for large statistics, counter numbers, and emphasis figures. The pink end of the signature gradient — used sparingly as luminous punctuation on dark surfaces |
| **Bioluminescent Gradient** | `linear-gradient(90deg, rgb(0, 130, 124) 0%, rgb(203, 255, 252) 100%)` | `--gradient-bioluminescent-gradient` | Signature button and UI gradient — linear sweep from teal-cyan through pale aqua into lavender-pink. The brand's signature chromatic gesture |
| **Aurora Gradient** | `linear-gradient(90deg, rgb(203, 255, 252) 0%, rgb(237, 255, 254) 26.25%, rgb(255, 253, 250) 47.57%, rgb(250, 209, 255) 88.96%)` | `--gradient-aurora-gradient` | Supporting palette color for small decorative accents when the core palette needs contrast. |

---

## 2. Tokens — Typography

### Matter — Primary Display & Body
- **Weights:** `400` (Body), `500` (Headings H1–H3 & Kinetic Display)
- **Line Heights:** `1.0` (Display & Headings), `1.3` (Subheading), `1.4` (Body & Caption)
- **Letter Spacing:**
  - Display (96px): `-3.84px` (`-0.04em`)
  - Heading-LG (61px): `-2.44px` (`-0.04em`)
  - Heading (36px): `0` (Line-height 1.0)
  - Subheading (24px): `-0.48px` (`-0.02em`)
  - Body (16px): `0` (Line-height 1.4)
  - Caption (10px): `1.5px` (`0.15em` uppercase)

### Arial — Secondary Fallback
- **Weights:** `400`
- **Sizes:** `14px` (`--font-arial`)
- **Role:** Fallback for interactive UI elements (button text, utility copy).

---

## 3. Tokens — Spacing & Shapes

- **Base unit:** `4px`
- **Page max-width:** `1440px`
- **Section gap:** `68px`
- **Card padding:** `36px–48px`
- **Border radius:**
  - Cards: `16px` (`--radius-cards`)
  - Buttons / Small elements / Arrow badges: `6px` (`--radius-buttons`, `--radius-small`)

---

## 4. Components & Elevation Architecture

1. **Centered Hero (No Photo)**:
   - Centered text stack occupying viewport height: Eyebrow label → 61–96px Headline at Matter 500 → Subtext max-w 65ch → Signature Aurora Gradient CTA button.
   - 3D Bioluminescent Particle Sphere floating centered in the background as the defining brand entity.
2. **Gradient Pill Button**: Primary CTA with Aurora gradient (`#cbfffc` → `#edfffe` → `#fffdfa` → `#fad1ff`), dark text `#011d1c` / `#222222`, 6px radius.
3. **Surface Card (`#003734`)**: 16px radius, 36px padding, zero drop shadows.
4. **Recessed Card / Sunken Well (`#011d1c`)**: 16px radius, deep 120px vertical padding.
5. **Arrow Icon Button**: 32×32 square button, 6px radius, `rgba(3, 81, 75, 0.5)` fill, white ↗ icon.
6. **Statistic Counter**: Lavender Phosphor `#fde9ff` at 86px with `-0.046em` letter spacing.
7. **Geometric Molecular Illustration**: Flat SVG network diagrams on dark canvas.
