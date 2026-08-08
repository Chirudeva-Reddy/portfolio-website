# Implementation Plan: Chirudeva Reddy Portfolio Migration

## Overview

Migrate the root portfolio from the legacy Express/HTML delivery into a responsive Next.js App Router site. Preserve Chirudeva Reddy's existing copy and local `public/assets` imagery, then build the requested interaction system in dependency order: smooth scroll, adaptive cursor, curtain reveal, bento showcase, and project expansion.

## Confirmed Decisions

- Owner: Chirudeva Reddy.
- Runtime: Next.js App Router at the repository root.
- Visual direction: dark obsidian with sharp cyan and emerald accents; no violet.
- Content and media: retain the existing portfolio copy and local assets; remove remote placeholder project imagery.
- Motion: the supplied cubic-bezier and spring values apply everywhere. Motion must use transform and opacity only.
- State: local modal state plus the required scroll context. No Zustand store is needed.

## Dependency Order

```text
Next/Tailwind foundation
  -> shared motion tokens and root shell
     -> smooth-scroll context and cursor
        -> curtain completion gate
           -> typed local project data and bento grid
              -> shared-layout modal
                 -> responsive and accessibility verification
```

## Task List

### Phase 1: Foundation

#### Task 1: Migrate the root to Next.js App Router

**Description:** Replace the Express startup path with the minimal typed Next.js, Tailwind, and Framer Motion foundation. Preserve the current static implementation and assets until the Next build succeeds.

**Acceptance criteria:**
- [x] `npm run dev` starts the App Router application from the repository root.
- [x] `npm run build` completes successfully.
- [x] Global CSS defines semantic `oklch()` dark, cyan, and emerald tokens plus the shared easing and spring values.

**Verification:**
- [x] Run the production build.
- [ ] Load the root route without hydration errors.

**Dependencies:** None.

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `app/layout.tsx`
- `app/globals.css`

**Estimated scope:** Medium.

#### Task 2: Build the smooth-scroll shell and shared motion tokens

**Description:** Add the Lenis-backed client shell, a typed `useScrollContext()` hook, and the small shared motion constants required by multiple components. The shell must be inert for reduced-motion users and safe during SSR.

**Acceptance criteria:**
- [x] Descendants can read typed Lenis, scroll, velocity, and direction values through `useScrollContext()`.
- [x] The RAF loop and Lenis instance are cleaned up on unmount.
- [x] Reduced-motion users keep native scrolling.

**Verification:**
- [x] Navigate and unmount without console errors.
- [ ] Confirm native scrolling when reduced motion is enabled.

**Dependencies:** Task 1.

**Files likely touched:**
- `src/lib/motion.ts`
- `src/components/ui/SmoothScroll.tsx`
- `app/layout.tsx`

**Estimated scope:** Small.

#### Task 3: Build Component A's adaptive magnetic cursor

**Description:** Replace the untracked cursor draft with an SVG cursor driven by requestAnimationFrame and motion values. It will detect magnetic targets, label them, and disappear entirely for coarse pointers or reduced motion.

**Acceptance criteria:**
- [x] The 8px dot and 30px ring track a fine pointer with the specified spring physics.
- [x] `data-magnetic="true"` targets center and label the ring without layout-changing animation.
- [x] All listeners and RAF work are removed on unmount.

**Verification:**
- [x] Hover a magnetic target and confirm snap, label, and exit behavior.
- [ ] Confirm no cursor renders at a coarse-pointer viewport.

**Dependencies:** Tasks 1-2.

**Files likely touched:**
- `src/components/ui/CustomCursor.tsx`
- `app/layout.tsx`

**Estimated scope:** Small.

### Checkpoint: Core Shell

- [ ] The App Router build succeeds.
- [ ] Native scrolling and no custom cursor are preserved for motion-reduced and touch users.
- [ ] Desktop pointer interaction has no console errors or listener leaks.

### Phase 2: Entry and Showcase

#### Task 4: Build Component B's curtain entry transition

**Description:** Implement the portal-based asymmetric SVG path reveal and connect its completion to a root content opacity gate. It locks document scrolling only while active and restores it reliably.

**Acceptance criteria:**
- [x] Content does not appear before the initial curtain coverage is complete.
- [x] The curtain path and title-character stagger obey the shared easing and reduced-motion fallback.
- [x] Scroll lock is restored after completion, unmount, and early route exit.

**Verification:**
- [x] Reload the route and observe one complete reveal without FOUC.
- [x] Test keyboard navigation after the curtain completes.

**Dependencies:** Tasks 1-3.

**Files likely touched:**
- `src/components/ui/CurtainReveal.tsx`
- `src/components/PortfolioShell.tsx`
- `app/page.tsx`

**Estimated scope:** Small.

#### Task 5: Build Component C's typed, local-asset bento grid

**Description:** Define typed project data from the existing local images and render it in a responsive, irregular three-column bento layout. Cards reveal once in view using the supplied spring and 0.1 second stagger.

**Acceptance criteria:**
- [x] `BentoItemProps` includes the specified fields and maps every project to a local asset.
- [x] The layout is one column on mobile and three asymmetric columns from the medium breakpoint.
- [x] Reveals use only opacity and translate transforms and respect reduced motion.

**Verification:**
- [x] Check 320px, 768px, 1024px, and 1440px layouts.
- [ ] Confirm each card animation runs once on entry.

**Dependencies:** Tasks 1-4.

**Files likely touched:**
- `src/data/projects.ts`
- `src/components/sections/BentoGrid.tsx`
- `app/page.tsx`

**Estimated scope:** Small.

#### Task 6: Build Component D's card interaction and project modal

**Description:** Implement keyboard-accessible card activation, motion-safe hover details, shared-layout image expansion, grid de-emphasis, focus management, and safe scroll restoration.

**Acceptance criteria:**
- [x] Each card is operable by mouse, Enter, and Space.
- [x] Hover uses image transform/filter state, title translation, and arrow translation without geometry animation.
- [x] The modal closes by Escape, close control, or backdrop; returns focus; and prevents background scrolling.

**Verification:**
- [x] Open and close a project with pointer, Space, Escape, the close control, and the backdrop.
- [x] Confirm the selected thumbnail and modal hero share one `layoutId` transition.

**Dependencies:** Task 5.

**Files likely touched:**
- `src/components/sections/BentoCard.tsx`
- `src/components/sections/ProjectModal.tsx`
- `src/components/sections/BentoGrid.tsx`

**Estimated scope:** Small.

### Checkpoint: Complete

- [x] Production build and TypeScript validation succeed.
- [x] The page is checked at 320px, 768px, 1024px, and 1440px.
- [ ] Reduced motion and coarse pointer are manually checked.
- [x] Keyboard modal flow and initial entry are manually checked.
- [x] Existing local assets and Chirudeva Reddy identity are visible; no remote placeholder project images remain.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Legacy Express files and untracked TSX drafts do not form a runnable React app. | High | Move only the chosen runtime to Next and verify the build before retiring any legacy entrypoint. |
| High-motion effects can impair usability or cost frames. | High | Use transform/opacity only, `will-change` only while moving, and disable enhancement for reduced motion and coarse pointers. |
| The existing `design.md` conflicts with the chosen no-violet direction. | Medium | Align the token map during the foundation task; do not add a second design system. |
| A modal can trap focus or leave the page scroll-locked. | High | Use native buttons, restore the triggering element's focus, and centralize lock cleanup in the modal lifecycle. |
