# Animation Guide for ProdBay

This guide documents the animation system implemented across the ProdBay application, providing consistent, accessible, and performant animations.

## Overview

Our animation strategy is built on **Framer Motion** with a focus on:
- **Consistency** - Standardized animation patterns across all components
- **Accessibility** - Respects user motion preferences
- **Performance** - Optimized for smooth 60fps animations
- **Maintainability** - Centralized configuration and reusable components

## Architecture

### Core Files

```
src/
├── utils/
│   └── animations.ts          # Animation configuration and variants
├── hooks/
│   └── useReducedMotion.ts    # Accessibility hooks
└── components/shared/
    ├── AnimatedContainer.tsx  # Reusable animation components
    └── AnimatedList.tsx       # List and grid animations
```

## Animation Configuration

### Timing Presets

```typescript
const ANIMATION_DURATION = {
  fast: 0.2,      // Quick interactions
  normal: 0.3,    // Standard transitions
  slow: 0.6,      // Complex animations
  verySlow: 1.0,  // Special effects
};
```

### Easing Functions

```typescript
const EASING = {
  easeInOut: [0.4, 0, 0.2, 1],  // Smooth, natural motion
  easeOut: [0, 0, 0.2, 1],      // Quick start, slow end
  easeIn: [0.4, 0, 1, 1],       // Slow start, quick end
  bounce: [0.68, -0.55, 0.265, 1.55], // Playful bounce
};
```

### Predefined Variants

```typescript
const ANIMATION_VARIANTS = {
  fadeIn: { /* ... */ },
  fadeInUp: { /* ... */ },
  scaleIn: { /* ... */ },
  expandHeight: { /* ... */ },
  cardHover: { /* ... */ },
  // ... more variants
};
```

## Usage Examples

### Basic Animation

```tsx
import { FadeIn } from '@/components/shared/AnimatedContainer';

<FadeIn delay={0.2} duration={0.5}>
  <div>This will fade in with a 0.2s delay</div>
</FadeIn>
```

### Card Animations

```tsx
import { AnimatedGrid } from '@/components/shared/AnimatedList';

<AnimatedGrid staggerDelay={0.1}>
  {projects.map(project => (
    <ProjectCard key={project.id} project={project} />
  ))}
</AnimatedGrid>
```

### Expandable Content

```tsx
import { Expandable } from '@/components/shared/AnimatedContainer';

<Expandable isExpanded={isOpen}>
  <div>This content will expand/collapse smoothly</div>
</Expandable>
```

### Custom Animations

```tsx
import { useAccessibleAnimation } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

const MyComponent = () => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();
  
  const variants = getAnimationVariant({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.05 }
  });

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      Content
    </motion.div>
  );
};
```

## Accessibility

### Reduced Motion Support

All animations automatically respect the `prefers-reduced-motion` CSS media query:

```typescript
// Automatically reduces animation duration to 0.01s
const { getAnimationVariant } = useAccessibleAnimation();
const variants = getAnimationVariant(myVariants);
```

### Focus Management

Animations include proper focus management for keyboard navigation:

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileFocus={{ scale: 1.05 }}
  // Focus styles are handled by CSS
>
  Button
</motion.button>
```

## Performance Best Practices

### 1. Use `will-change` Sparingly

```tsx
// Only on elements that will animate
<motion.div style={{ willChange: 'transform' }}>
  Content
</motion.div>
```

### 2. Prefer `transform` and `opacity`

```tsx
// ✅ Good - uses transform (GPU accelerated)
const variants = {
  hover: { scale: 1.05, y: -2 }
};

// ❌ Avoid - causes layout reflow
const variants = {
  hover: { width: '200px', height: '100px' }
};
```

### 3. Use `layout` for Layout Animations

```tsx
<motion.div layout>
  {/* Content that changes size/position */}
</motion.div>
```

### 4. Stagger Animations

```tsx
// Stagger children animations
<motion.div
  variants={{
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map(item => <AnimatedItem key={item.id} />)}
</motion.div>
```

## Component-Specific Guidelines

### Accordion Components

- Use `height: "auto"` for smooth expand/collapse
- Include chevron rotation animations
- Respect reduced motion preferences

### Project Cards

- Staggered entrance animations
- Hover effects with `scale` and `y` transforms
- Smooth transitions between states

### Modal Dialogs

- Backdrop fade-in/out
- Content scale and slide animations
- Proper focus trapping

### Lists and Grids

- Staggered children animations
- Smooth reordering with `layout` prop
- Responsive grid animations

## Debugging Animations

### 1. Check Reduced Motion

```javascript
// In browser console
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

### 2. Performance Monitoring

```javascript
// Monitor animation performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
});
observer.observe({ entryTypes: ['measure'] });
```

### 3. Framer Motion DevTools

Install the Framer Motion DevTools browser extension for debugging animations.

## Migration Guide

### From CSS Transitions

**Before:**
```css
.transition {
  transition: all 0.3s ease-in-out;
}
```

**After:**
```tsx
<motion.div
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
  Content
</motion.div>
```

### From Fixed Heights

**Before:**
```tsx
<div className={`${isOpen ? 'h-96' : 'h-0'} transition-all`}>
  Content
</div>
```

**After:**
```tsx
<Expandable isExpanded={isOpen}>
  Content
</Expandable>
```

## Future Enhancements

1. **Gesture Support** - Add swipe and drag gestures
2. **Layout Animations** - Implement shared element transitions
3. **Micro-interactions** - Add subtle feedback animations
4. **Loading States** - Skeleton loaders with animations
5. **Error States** - Animated error messages and retry buttons

## Troubleshooting

### Common Issues

1. **Animations not respecting reduced motion**
   - Ensure you're using `useAccessibleAnimation` hook
   - Check that `getAnimationVariant` is being called

2. **Performance issues**
   - Avoid animating layout properties
   - Use `will-change` only when necessary
   - Consider reducing animation complexity on mobile

3. **Layout shifts during animation**
   - Use `height: "auto"` instead of fixed heights
   - Implement proper `overflow: hidden` on containers

4. **Accessibility concerns**
   - Ensure animations don't interfere with screen readers
   - Provide alternative ways to access animated content
   - Test with keyboard navigation

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [CSS `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
