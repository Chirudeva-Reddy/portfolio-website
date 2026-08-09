# DESIGN.md — Awwwards-Grade Creative Frontend System & Token Map

## 1. Vibe Check & Architectural Vision
> "Swiss Neo-Grotesque Utilitarianism meets High-Octane Motion & Kinetic Precision."
An ultra-performant, dark-mode-native portfolio built on Next.js (App Router), React, Framer Motion, Lenis, and Zustand. Powered by `oklch()` color space for uniform lightness/chroma rendering and GPU-accelerated motion primitives.

---

## 2. Token Map (`oklch()` CSS Color Space & Design Variables)

```css
:root {
  /* Color System — oklch() Perceptually Uniform Palette */
  --surface-base: oklch(0.13 0.01 260);          /* Deep Obsidian Base */
  --surface-elevated: oklch(0.18 0.015 260);     /* Card & Floating Surface */
  --surface-hover: oklch(0.22 0.02 260);        /* Interactive Hover Surface */
  --surface-overlay: oklch(0.13 0.01 260 / 0.85); /* Glassmorphic Backdrop Blur */

  /* Borders & Dividers */
  --border-subtle: oklch(0.96 0.005 260 / 0.08); /* 1px Ultra-fine Hairline */
  --border-active: oklch(0.78 0.18 190 / 0.4);   /* Focused / Active Highlight */

  /* Semantic Accents */
  --accent-violet: oklch(0.68 0.24 280);        /* Electric Violet Primary Accent */
  --accent-cyan: oklch(0.78 0.18 190);          /* High-Vibrancy Cyan Secondary Accent */
  --accent-emerald: oklch(0.75 0.20 155);       /* Live System Status Glow */

  /* Typography Scale & Contrast */
  --text-primary: oklch(0.96 0.005 260);        /* High-Contrast Body & Headings */
  --text-muted: oklch(0.70 0.01 260);          /* Secondary Technical Copy */
  --text-dim: oklch(0.48 0.01 260);            /* De-emphasized Captions & Numbers */

  /* Motion & Spring Physics Tokens */
  --ease-custom: cubic-bezier(0.76, 0, 0.24, 1);
  --spring-stiffness: 150;
  --spring-damping: 20;
  --spring-mass: 0.5;

  /* Corner Radius Scale (Strict Sharp or Pill) */
  --radius-sharp: 0px;
  --radius-card: 16px;
  --radius-pill: 999px;
}
```

---

## 3. Typography System
- **Display / Headings**: *Space Grotesk* (`font-display`, weights: 600, 700, tracking: `-0.03em`)
- **Body & Copy**: *Geist Sans* / *Plus Jakarta Sans* (`font-sans`, weights: 400, 500, line-height: `1.6`)
- **Technical Metadata / Code**: *JetBrains Mono* (`font-mono`, weights: 400, 500, tracking: `0.02em`)

---

## 4. Component Hierarchy (Tree Layout)

```
app/
├── layout.tsx                [Root Shell: Theme, Fonts, LenisProvider, CanvasBackground]
├── template.tsx              [AnimatePresence Page Entrance / Exit Transitions]
├── page.tsx                  [Main Portfolio Landing Page]
├── globals.css               [oklch() Design Tokens, Utility Classes, Reset]
└── design.md                 [Single Source of Truth Token Blueprint]

components/
├── ui/
│   ├── CustomCursor.tsx      [Zustand-connected GPU Magnetic Pointer & Ring]
│   ├── Preloader.tsx         [Monogram Counters & Split-Screen Exit Wipe]
│   ├── SmoothScroll.tsx      [Lenis React Global Smooth Scroll Wrapper]
│   └── BackgroundCanvas.tsx  [HTML5 Canvas Shader / Ambient Spotlight Layer]
├── sections/
│   ├── HeroSection.tsx       [Asymmetric Split, Interactive Code Card, Magnetic CTAs]
│   ├── AboutSection.tsx      [System Philosophy & High-Contrast Metrics Grid]
│   ├── TechMatrix.tsx        [Bento Grid Competencies with Hover Acceleration]
│   ├── ProjectsPin.tsx       [Scroll-Pinned Horizontal Project Cards Track]
│   ├── ExperienceTimeline.tsx[Consistent Mono Date Badges & Role Cards]
│   └── DualKineticMarquee.tsx[Velocity-Accelerated Counter-Rotating Text Tracks]
└── store/
    └── useUIStore.ts         [Zustand Store: cursorState, preloader, activeSection]
```

---

## 5. Zustand Store Specification (`useUIStore.ts`)

```typescript
export type CursorState = 'default' | 'hover' | 'drag' | 'text';

interface UIState {
  cursorState: CursorState;
  cursorTargetText: string | null;
  isPreloaderComplete: boolean;
  activeSection: string;
  setCursorState: (state: CursorState, targetText?: string | null) => void;
  setPreloaderComplete: (complete: boolean) => void;
  setActiveSection: (section: string) => void;
}
```

---

## 6. Non-Negotiable Quality Gates
- [x] **Zero Layout Thrashing**: Motion constrained strictly to `transform` and `opacity`.
- [x] **SSR Gate**: All DOM measurements, `window`, and `document` APIs gated behind client hooks.
- [x] **Accessibility**: Hardware prefers-reduced-motion fallback implemented across Framer Motion variants.
- [x] **Button Contrast & Wrap Protection**: `white-space: nowrap` on all CTAs, contrast ratio ≥ 4.5:1.
