

## Scroll Animations for Landing Page Sections

### Overview
Add scroll-triggered reveal animations to each section ("dobra") of the landing page so elements animate in as the user scrolls down, creating a dynamic and engaging experience.

### Approach
Create a reusable `useScrollReveal` hook using the native `IntersectionObserver` API (no extra dependencies needed). Then wrap each section's content with an animation container that fades/slides in when it enters the viewport.

### Implementation Details

**1. Create `src/hooks/useScrollReveal.ts`**
- A custom hook that returns a `ref` callback
- Uses `IntersectionObserver` with a threshold (~0.15) to detect when elements enter the viewport
- Adds a CSS class (e.g., `revealed`) when the element is visible
- Fires once per element (unobserves after reveal)

**2. Create a `ScrollReveal` wrapper component (`src/components/common/ScrollReveal.tsx`)**
- Accepts `direction` prop: `"up"` (default), `"left"`, `"right"`, `"scale"`
- Accepts optional `delay` (stagger support) and `className`
- Starts with opacity-0 and a small transform offset
- On intersection, transitions to opacity-1 and transform-none
- Uses CSS transitions (not keyframe animations) for smooth, GPU-accelerated reveals

**3. Update `src/pages/LandingPage.tsx`**
Wrap each section's content with `<ScrollReveal>`:

| Section | Animation |
|---------|-----------|
| Hero (Seção 1) | Fade-up for text, fade-right for phone mockup |
| Conexão com a Dor (Seção 2) | Fade-up for heading/text, scale for icon cards, staggered fade-up for stats |
| Como Funciona (Seção 3) | Alternating left/right for each timeline step |
| Funcionalidades (Seção 4) | Alternating left/right for each feature grid |
| Para Quem É (Seção 5) | Staggered fade-up for each persona card |
| Social Proof | Scale for stat cards |
| Planos e Preços (Seção 6) | Staggered fade-up for pricing cards |
| Footer | Simple fade-up |

**4. Add base CSS to `src/index.css`**
```css
.scroll-reveal {
  opacity: 0;
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.scroll-reveal.revealed {
  opacity: 1;
  transform: none !important;
}
```

### Key Decisions
- No new dependencies -- uses native `IntersectionObserver`
- CSS transitions (not JS-driven animations) for performance
- Each animation fires only once (no re-hide on scroll up) for a polished feel
- Stagger delays on card grids (50-100ms increments) for a cascading effect

