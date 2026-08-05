# DESIGN.md — Lead UI/UX Architecture & Token Specification

## 1. Executive Summary & Brand Direction
- **Brand / Entity**: Chirudeva Reddy Butukuri — CS Scholar & AI/ML Engineer (BITS Pilani Dubai)
- **Aesthetic Direction**: Deconstructed Cyber-Blueprint Editorial. Rich obsidian `oklch()` palette with cyber cyan & emerald accents, sharp brutalist typography contrast, mathematically equal padding, zero random ambient purple glows, and zero wrapped button text.

---

## 2. Color System (`oklch()` Perceptual Uniform Tokens)

```css
:root {
	/* Surface Palette */
	--surface-base: oklch(0.10 0.01 250);       /* Deep Obsidian Slate Base */
	--surface-card: oklch(0.14 0.018 250);      /* Primary Card Surface */
	--surface-card-hover: oklch(0.18 0.025 250);/* Hover Elevated Surface */
	--surface-overlay: oklch(0.12 0.01 250 / 0.9); /* Sticky Blur Overlay */

	/* Borders */
	--border-subtle: oklch(0.96 0 0 / 0.08);   /* 1px Precise Border */
	--border-dashed: oklch(0.96 0 0 / 0.14);   /* Blueprint Line */

	/* Semantic Accents */
	--accent-cyan: oklch(0.75 0.18 195);       /* Cyberpunk Cyan */
	--accent-emerald: oklch(0.72 0.19 160);    /* Live Emerald Status */
	--accent-primary: oklch(0.65 0.22 250);    /* Electric Cyber Blue */

	/* Typography Contrast */
	--text-main: oklch(0.96 0.005 250);       /* High-contrast Header Text */
	--text-muted: oklch(0.72 0.01 250);       /* Muted Body Copy */
	--text-dim: oklch(0.52 0.01 250);         /* De-emphasized Metadata */
}
```

---

## 3. Typography & Google Fonts Specification

### Fonts API Import Link
`https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Reenie+Beanie&display=swap`

### Font Pairings & Roles
- **Display Headlines**: `Syne` (Ultra-wide 800 weight)
- **Serif Accents**: `Fraunces` (Editorial italic contrast)
- **Section Headers & Stats**: `Space Grotesk` (Geometric technical headings)
- **Body & Copy**: `Plus Jakarta Sans` (Clean modern sans-serif)
- **Code & Syntax**: `JetBrains Mono` (Monospaced data)
- **Handwritten Notes**: `Reenie Beanie` (Organic cursive annotations)

---

## 4. Spacing Rhythm & Layout Scale
- **Section Padding**: Minimum `py-24` (`120px`) vertical rhythm.
- **Asymmetric Bento Widths**: `63% / 37%`, `38% / 62%`, `68% / 32%` (No symmetrical 50/50 slop).
- **Button Protection**: `whitespace-nowrap` on all CTA buttons with `10px 18px` inline padding to prevent text wrapping.
- **Eyebrow Letter-Spacing**: `letter-spacing: 3px` (`tracking-wider`) on uppercase eyebrows.

---

## 5. Anti-Slop Audit Checklist (Enforced)
- [x] **No Random Purple Ambient Glows**: Background uses clean fixed grid canvas.
- [x] **No Inter/Geist/Arial Fonts**: Powered by `Syne`, `Fraunces`, `Space Grotesk`, `Plus Jakarta Sans`.
- [x] **No Wrapped Buttons**: CTA buttons enforce `white-space: nowrap`.
- [x] **No Uneven Inset Padding**: All cards enforce equal `32px` padding.
- [x] **No Generic Stock Photos**: Custom profile photo, brand icons, and syntax-highlighted code editor boxes.
- [x] **Micro-Interactions Enabled**: Tactile `:active` scale (`scale(0.98)`), magnetic button physics, and custom interactive cursor ring.
