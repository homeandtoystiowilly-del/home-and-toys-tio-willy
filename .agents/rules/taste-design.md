# Taste & Impeccable Design Guidelines: Home & Toys Tío Willy

This project follows the **Impeccable** and **Taste-Skill** design standards for high-craft, anti-fatigue UI:

## 1. Design Read & Identity
* **Design Read:** Premium E-commerce & Wholesale Distribution catalog for toys, home goods, and tech gadgets.
* **Anti-Fatigue Dark Palette:** Deep charcoal/zinc canvas (`zinc-950` / `#09090b`) replacing pure `#000000` pitch black to avoid eye strain. Elevated surfaces in `zinc-900` (`#18181b`) with borders in `zinc-800`. Vibrant brand red accents (`#FF2D2D` / `red-600`) with WCAG AA verified contrast.

## 2. Core Dials Configuration
* **`DESIGN_VARIANCE: 7`** (Custom, non-templated commercial layout with high visual interest).
* **`MOTION_INTENSITY: 6`** (Physics-based touch scrolling, swipe gestures, smooth deceleration; no tacky bounce animations).
* **`VISUAL_DENSITY: 4`** (Generous breathing room, thumb-friendly mobile tap targets $\ge 44\text{ px}$, legible typography).

## 3. Impeccable Quality Floor & Anti-Slop Principles
* **Touch Targets:** Every interactive element (buttons, category tabs, carousel controls, inputs) must be at least $44\text{ px}$ tall (`min-h-[44px]`).
* **Tactile Feedback:** Buttons and interactive cards must provide instantaneous physical feedback via `active:scale-95` and clear `cursor-pointer`.
* **Motion Deceleration:** Replace outdated `animate-bounce` with smooth exponential deceleration, subtle pulses, or crisp transitions.
* **Color on Color:** Never place washed-out gray text over solid color backgrounds; use high-contrast white or deep tone.
