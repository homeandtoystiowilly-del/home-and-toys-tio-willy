# Design System: Home & Toys Tío Willy

<!-- impeccable:design-schema 1 -->

## Core Philosophy: Anti-Fatigue Dark Theme & High Craft

This design system fuses **Impeccable** craft principles with the **taste-skill** configuration:

### The Dials
- **`DESIGN_VARIANCE: 7`** (Custom, distinctive commercial e-commerce layout without generic templates).
- **`MOTION_INTENSITY: 6`** (Physics-based touch scrolling, swipe gestures, restrained deceleration).
- **`VISUAL_DENSITY: 4`** (Generous whitespace, thumb-friendly touch targets $\ge 44\text{ px}$, legible typography).

---

## Color Tokens: Anti-Fatigue Palette
Replacing pure, eye-straining `#000000` pitch black with deep, textured charcoal/zinc tones:

- **Surface Base (Canvas):** `bg-zinc-950` (`#09090b`) — Absorbs light comfortably during night and mobile browsing.
- **Surface Elevated (Cards & Modals):** `bg-zinc-900/90` (`#18181b`) with border `border-zinc-800/80`.
- **Surface Hover/Highlight:** `bg-zinc-800` (`#27272a`).
- **Brand Primary Accent:** `bg-red-600` (`#dc2626`) / Text `text-red-500` (`#FF2D2D`) with WCAG AA compliance.
- **Brand Glow/Shadows:** `shadow-red-950/50` / `border-red-500/30`.
- **Typography:** Primary `text-white`, Secondary `text-zinc-300`, Muted/Labels `text-zinc-400` and `text-zinc-500`.

---

## Interactive Physics & Tactile Response
1. **Target Area:** Every touch element (category chips, CTA buttons, inputs, slider arrows) must have a minimum physical size of $44\text{ px}$ (`min-h-[44px]`).
2. **Press Feedback:** `active:scale-95` on buttons and cards for instantaneous physical haptic feel.
3. **Cursor Cues:** Explicit `cursor-pointer` on all interactive triggers.
4. **Easing:** Real deceleration using smooth curves; no outdated cartoonish `animate-bounce` easing.
5. **Color on Color:** Avoid low-contrast gray text on solid color badges; use white or dark tone matching the background.
