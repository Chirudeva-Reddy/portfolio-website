# UI library research

Checked 2026-08-21 against first-party documentation and repositories. The current root package is an Express/static app using GSAP, Lenis, and Three; it does not currently install React, Next.js, Tailwind CSS, Motion, or shadcn ([package.json](../package.json)).

## Motion

- Official site: [motion.dev](https://motion.dev/)
- Motion for React is the successor to Framer Motion and uses `motion/react`; the official quick start documents declarative animation, layout, gestures, scroll, springs, `AnimatePresence`, and motion values ([React quick start](https://motion.dev/docs/react-quick-start)).
- Installation is `npm install motion`; the React API requires a React application ([installation](https://motion.dev/docs/react-installation)). The site currently identifies Motion as v13.1.0 and MIT/open source ([home](https://motion.dev/)).
- Recommendation: do not add it to this legacy root yet. If the portfolio is moved to React, use Motion as the single React animation layer and port only the existing transition/cursor pieces first; keep GSAP/Lenis untouched until each overlap is measured.

## Bklit UI (identity verified)

- The intended project is **Bklit UI**, not `bklitui.com`: [bklit.com](https://bklit.com/) and the linked first-party repository [bklit/bklit-ui](https://github.com/bklit/bklit-ui). The guessed `bklitui.com` host did not resolve during verification.
- It is a shadcn/ui registry focused on charts and data visualization. Its installation docs require shadcn, register `@bklit` at `https://ui.bklit.com/r/{name}.json`, and install source components such as `@bklit/area-chart` ([installation](https://bklit.com/docs/installation)).
- Recommendation: not a fit for the current portfolio shell unless the site gains a real analytics/data-viz surface. If that happens after a React/shadcn migration, install individual chart sources rather than treating Bklit as a general UI framework.

## Kokonut UI

- Official site and source: [kokonutui.com](https://kokonutui.com/) and [kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui).
- It provides open-source React/Tailwind/Motion components through the shadcn CLI/registry. The official installation guide supports copy/paste or `shadcn` registry installation, requires Tailwind CSS v4, and commonly uses `cn`, Lucide, and shadcn dependencies ([installation](https://kokonutui.com/docs)).
- Example install path: configure `@kokonutui` as `https://kokonutui.com/r/{name}.json`, then add a component such as `@kokonutui/particle-button`; components are copied into the project and remain customizable ([installation](https://kokonutui.com/docs)).
- Recommendation: strongest visual-component candidate after a React/Tailwind migration. Start with one isolated component in a prototype; do not add the registry or MCP setup to this Express app just for future use. The MCP guide is optional and should be considered only when component installation becomes recurring ([MCP guide](https://kokonutui.com/docs/mcp)).

## Practical decision

1. Keep the current root unchanged for now; none of the three is directly compatible with its present Express/static dependency boundary.
2. If a React migration is approved, choose **Motion** for animation first, then add **Kokonut UI** components selectively.
3. Add **Bklit UI** only for an actual chart/data-visualization requirement. No package was installed and no application code was modified during this research.
