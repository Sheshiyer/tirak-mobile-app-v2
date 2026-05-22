# Design Token System - Developer Reference

## 🎯 Quick Reference for Consistent Implementation

This design token system ensures consistent styling across all app components. **Always refer to this guide when creating new components, interactions, or UI elements.**

## Strategic Font Usage Philosophy

### Custom Fonts (Visual Impact)
- **Headings**: `Garet-Heavy` - For main titles and headers (24px)
- **Subheadings**: `ProximaNova-Semibold` - For section titles (18px)

### System Fonts (Performance & Readability)
- **Body Text**: Platform-specific system fonts (San Francisco on iOS, Roboto on Android)
- **Captions**: Platform-specific system fonts for optimal readability

## Quick Start

### Import Design Tokens
```typescript
import { designTokens, componentTokens } from '@/constants/design-tokens';
```

### Typography Usage
```typescript
import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';

// Use typography components (recommended)
<Heading>Main Title</Heading>
<Subheading>Section Title</Subheading>
<Body>Content text for optimal readability</Body>
<Caption>Additional information</Caption>

// Or use design tokens directly
<Text style={designTokens.typography.styles.heading}>Custom Heading</Text>
```

### Color Usage
```typescript
// Reference image colors (exact values)
backgroundColor: designTokens.colors.reference.purple,    // #A85CF9
backgroundColor: designTokens.colors.reference.pink,     // #FFBAA0
backgroundColor: designTokens.colors.reference.lightPink, // #FDCEDF
backgroundColor: designTokens.colors.reference.white,     // #FFFFF5

// Semantic colors (recommended)
color: designTokens.colors.semantic.primary,
backgroundColor: designTokens.colors.semantic.surface,
borderColor: designTokens.colors.semantic.border,
```

### Spacing Usage
```typescript
// Use spacing scale
padding: designTokens.spacing.scale.md,        // 16px
margin: designTokens.spacing.scale.lg,         // 24px
gap: designTokens.spacing.scale.sm,            // 8px

// Component-specific spacing
padding: designTokens.spacing.components.card.padding,
```

### Component Tokens (Ready-to-use)
```typescript
// Apply complete component styling
<View style={componentTokens.card.default}>
  <Text style={componentTokens.text.heading}>Title</Text>
  <Text style={componentTokens.text.body}>Content</Text>
</View>
```

## Available Design Tokens

### Colors
- `designTokens.colors.reference.*` - Exact colors from reference image
- `designTokens.colors.semantic.*` - Semantic color system
- `designTokens.colors.components.*` - Component-specific colors

### Typography
- `designTokens.typography.families.*` - Font families with strategic usage
- `designTokens.typography.sizes.*` - Font sizes
- `designTokens.typography.styles.*` - Complete typography styles

### Spacing
- `designTokens.spacing.scale.*` - Base spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- `designTokens.spacing.components.*` - Component-specific spacing

### Border Radius
- `designTokens.borderRadius.*` - Border radius scale
- `designTokens.borderRadius.components.*` - Component-specific radius

### Shadows
- `designTokens.shadows.*` - Elevation system (sm, md, lg, xl)

### Gradients
- `designTokens.gradients.*` - Brand gradient combinations

### Animation
- `designTokens.animation.duration.*` - Animation durations
- `designTokens.animation.easing.*` - Easing curves for organic motion
- `designTokens.animation.presets.*` - Common animation presets

## Performance Benefits

### Fast Loading
- Body text and captions use system fonts (no loading delays)
- Custom fonts only load for headings/subheadings
- Web fallbacks ensure consistent rendering

### High Readability
- System fonts optimized for each platform
- Proper line heights and spacing for content text
- Consistent typography hierarchy

### Visual Impact
- Custom fonts preserve brand identity for titles
- Strategic usage maintains visual hierarchy
- Organic motion design with proper easing

## Best Practices

### Do ✅
- Use Typography components for consistent styling
- Apply semantic colors for maintainable code
- Use spacing scale for consistent layouts
- Leverage component tokens for rapid development

### Don't ❌
- Don't use custom fonts for body text (performance impact)
- Don't hardcode color values (use semantic tokens)
- Don't create custom spacing values (use scale)
- Don't bypass the design token system

## Implementation Checklist

When creating new components or UI elements, ensure you:
- ✅ Use Typography components for all text
- ✅ Apply semantic colors from design tokens
- ✅ Use spacing scale for consistent layouts
- ✅ Apply proper border radius from tokens
- ✅ Use shadow tokens for elevation
- ✅ Follow strategic font usage (custom for headings, system for body)

## File Structure

```
constants/
├── colors.ts              # Base color and typography definitions
├── design-tokens.ts       # Comprehensive design token system
components/ui/
├── Typography.tsx         # Typography components using design tokens
docs/
├── design-token-usage.md  # This developer reference guide
```

## 🚀 Ready for Implementation

This system ensures consistent, performant, and maintainable styling across the entire application while preserving brand identity and optimizing user experience. **Always consult this guide when building new features to maintain design consistency.**
