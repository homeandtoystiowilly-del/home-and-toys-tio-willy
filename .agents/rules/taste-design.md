# Taste Design Guidelines: Home & Toys Tío Willy

This project follows the **taste-skill** (design-taste-frontend from Leonxlnx/taste-skill) design standards to avoid generic, templated UI ( anti-slop):

## 1. Design Read & Identity
* **Design Read:** Premium E-commerce & Wholesale Distribution catalog for toys, home goods, and tech gadgets, with a bold Dark Theme language, leaning toward Tailwind CSS v4 utilities + Geist typography + high-contrast red accents (#FF2D2D / ed-600) over deep black (#000000) and zinc elevations (zinc-900, zinc-950).

## 2. Core Dials Configuration
* **DESIGN_VARIANCE: 7** (Balanced between clean commercial clarity and engaging modern layout).
* **MOTION_INTENSITY: 6** (Restrained, responsive motion: touch swipe on carousels, smooth scroll snap, micro-interactions without infinite distraction).
* **VISUAL_DENSITY: 4** (Generous whitespace, thumb-friendly mobile tap targets >= 44px, legible typography with minimum 11px on mobile).

## 3. Anti-Default & Anti-Slop Discipline
* **Never** use generic AI purple/blue gradient meshes. Maintain the store's authentic identity (black #000000, crisp red accents, white and zinc text).
* **Preserve** WCAG AA contrast on all elements: minimum 4.5:1 for body copy and clear visual states for buttons, badges, and inputs.
* **Touch-First Experience:** Horizontal carousels must feature snap-x snap-mandatory, smooth scrolling, and swipe gestures.
* **Component Isolation:** Interactive animations and gestures remain isolated inside 'use client' leaves, keeping server components lean and fast.
