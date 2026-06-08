# UI/UX Design Brief
## OmniShield AI - Examination Integrity Platform

**Version:** 1.0  
**Date:** June 2026  
**Status:** Submission Ready

---

## 1. Design Philosophy

OmniShield AI embodies a **sophisticated editorial aesthetic** that evokes high-end magazine design and academic rigor. The visual language combines:

- **Minimalist cream backgrounds** anchored by high-contrast typography
- **Massive, bold Didone serif headlines** dominating visual hierarchy
- **Elegant, lighter serif subheadings** creating typographic sophistication
- **Fine geometric lines** and small, spaced-out sans-serif labels for structural refinement
- **Generous negative space** and **asymmetrical balance** creating intellectual atmosphere
- **Timeless, refined** visual language appropriate for institutional trust

This approach positions OmniShield AI as a premium, trustworthy platform for academic institutions—not a generic admin dashboard.

---

## 2. Color Palette

### Primary Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Cream | #F5F1E8 | 245, 241, 232 | Background, safe space |
| Charcoal | #1A1A1A | 26, 26, 26 | Headlines, primary text |
| Slate | #4A4A4A | 74, 74, 74 | Secondary text, labels |
| Taupe | #8B8680 | 139, 134, 128 | Tertiary text, disabled states |

### Accent Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Emerald | #2D5F4F | 45, 95, 79 | Success, approval, active states |
| Amber | #C9A961 | 201, 169, 97 | Warning, investigation, caution |
| Crimson | #8B3A3A | 139, 58, 58 | Alert, error, rejection |
| Slate Blue | #4A5F7F | 74, 95, 127 | Information, secondary actions |

### Semantic Colors
| Semantic | Hex | Usage |
|----------|-----|-------|
| Success | #2D5F4F | Approved, resolved, complete |
| Warning | #C9A961 | Investigating, pending, caution |
| Error | #8B3A3A | Rejected, failed, alert |
| Info | #4A5F7F | Information, neutral actions |

---

## 3. Typography

### Font Stack
```css
/* Headlines - Didone Serif (Bold, Massive) */
font-family: 'Bodoni Moda', 'Didot', serif;
font-weight: 700;
font-size: 3.5rem - 4.5rem;
letter-spacing: -0.02em;
line-height: 1.1;

/* Subheadings - Serif (Elegant, Lighter) */
font-family: 'Lora', serif;
font-weight: 500;
font-size: 1.5rem - 2rem;
letter-spacing: -0.01em;
line-height: 1.3;

/* Body Text - Sans-serif (Readable) */
font-family: 'Inter', 'Helvetica Neue', sans-serif;
font-weight: 400;
font-size: 1rem;
letter-spacing: 0;
line-height: 1.6;

/* Labels - Sans-serif (Small, Spaced) */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 0.75rem - 0.875rem;
letter-spacing: 0.05em;
text-transform: uppercase;
```

### Typographic Hierarchy

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| H1 | Bodoni Moda | 3.5-4.5rem | 700 | Page titles, main headlines |
| H2 | Lora | 2rem | 500 | Section headers |
| H3 | Lora | 1.5rem | 500 | Subsection headers |
| Body | Inter | 1rem | 400 | Main content, descriptions |
| Label | Inter | 0.75rem | 600 | Form labels, badges, tags |
| Caption | Inter | 0.875rem | 400 | Metadata, timestamps, hints |

---

## 4. Layout & Spacing

### Spacing System
```
Base unit: 4px

Spacing scale:
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

### Grid System
- **Desktop:** 12-column grid with 24px gutter
- **Tablet:** 8-column grid with 16px gutter
- **Mobile:** 4-column grid with 8px gutter
- **Container:** Max-width 1400px with 48px side padding

### Generous Negative Space
- Minimum 24px padding around content
- 32px margin between major sections
- 48px vertical spacing between page sections
- Asymmetrical layouts with 60/40 or 70/30 splits

---

## 5. Component Design

### Buttons

#### Primary Button (Editorial)
```
Background: Charcoal (#1A1A1A)
Text: Cream (#F5F1E8)
Padding: 12px 32px
Border-radius: 2px
Font: Inter, 0.875rem, 600
Letter-spacing: 0.05em
Text-transform: uppercase

Hover: Background → Slate (#4A4A4A)
Active: Scale 0.97, transition 160ms ease-out
```

#### Secondary Button
```
Background: Transparent
Border: 2px solid Charcoal (#1A1A1A)
Text: Charcoal (#1A1A1A)
Padding: 10px 30px
Border-radius: 2px
Font: Inter, 0.875rem, 600

Hover: Background → Cream (#F5F1E8)
```

#### Status Buttons
- **Approve:** Emerald background, white text
- **Reject:** Crimson background, white text
- **Investigate:** Amber background, charcoal text

### Cards

```
Background: White (#FFFFFF)
Border: 1px solid Taupe (#8B8680) with 10% opacity
Border-radius: 4px
Padding: 24px
Box-shadow: 0 2px 8px rgba(26, 26, 26, 0.08)

Hover: Box-shadow → 0 4px 16px rgba(26, 26, 26, 0.12)
```

### Tables

```
Header Row:
  Background: Cream (#F5F1E8)
  Border-bottom: 2px solid Charcoal (#1A1A1A)
  Font: Inter, 0.75rem, 600, uppercase
  Padding: 12px 16px

Data Rows:
  Border-bottom: 1px solid Taupe (#8B8680) with 20% opacity
  Padding: 16px
  Font: Inter, 1rem, 400

Hover: Background → Cream (#F5F1E8) with 50% opacity
```

### Forms

```
Input Fields:
  Background: White (#FFFFFF)
  Border: 1px solid Taupe (#8B8680) with 30% opacity
  Border-radius: 2px
  Padding: 10px 12px
  Font: Inter, 1rem, 400

Focus: Border-color → Charcoal (#1A1A1A)
       Box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1)

Labels:
  Font: Inter, 0.875rem, 600, uppercase
  Color: Slate (#4A4A4A)
  Margin-bottom: 8px
  Letter-spacing: 0.05em
```

### Badges & Tags

```
Difficulty Badges:
  Easy: Emerald background, white text, uppercase
  Medium: Amber background, charcoal text, uppercase
  Hard: Crimson background, white text, uppercase
  
Status Badges:
  New: Slate Blue background, white text
  Investigating: Amber background, charcoal text
  Resolved: Emerald background, white text
  Pending: Taupe background, white text
  Approved: Emerald background, white text
  Rejected: Crimson background, white text

Styling:
  Padding: 4px 12px
  Border-radius: 2px
  Font: Inter, 0.75rem, 600, uppercase
  Letter-spacing: 0.05em
```

---

## 6. Navigation Design

### Sidebar Navigation
```
Width: 240px
Background: Charcoal (#1A1A1A)
Text: Cream (#F5F1E8)

Logo:
  Padding: 24px 16px
  Font: Bodoni Moda, 1.5rem, 700
  Color: Cream (#F5F1E8)

Menu Items:
  Padding: 12px 16px
  Font: Inter, 1rem, 400
  Border-left: 3px solid transparent
  
Active Item:
  Background: Slate (#4A4A4A)
  Border-left-color: Amber (#C9A961)
  
Hover:
  Background: Slate (#4A4A4A) with 50% opacity
```

### Header Navigation
```
Background: Cream (#F5F1E8)
Border-bottom: 1px solid Taupe (#8B8680) with 20% opacity
Height: 64px
Padding: 0 32px

Left: Logo/breadcrumb
Center: Page title
Right: User profile, notifications, logout
```

---

## 7. Micro-interactions & Animations

### Principles
- **Snappy, responsive:** All animations under 300ms
- **Purposeful:** Only animate meaningful state changes
- **Respectful:** Respect `prefers-reduced-motion` setting
- **GPU-accelerated:** Only animate `transform` and `opacity`

### Animation Timings
| Interaction | Duration | Easing | Effect |
|-------------|----------|--------|--------|
| Button press | 160ms | ease-out | scale(0.97) |
| Dropdown open | 200ms | ease-out | opacity + translateY |
| Modal appear | 300ms | ease-out | scale(0.95) + opacity |
| Hover state | 120ms | ease-out | opacity change |
| Loading spinner | 1s | linear | rotate(360deg) |
| Toast notification | 300ms | ease-out | slideIn |

### Specific Interactions

**Button Press:**
```css
transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);

:active {
  transform: scale(0.97);
}
```

**Dropdown Menu:**
```css
@keyframes dropdownOpen {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: dropdownOpen 200ms cubic-bezier(0.23, 1, 0.32, 1);
```

**Modal Entrance:**
```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

animation: modalEnter 300ms cubic-bezier(0.23, 1, 0.32, 1);
```

---

## 8. Responsive Design

### Breakpoints
| Breakpoint | Width | Device |
|-----------|-------|--------|
| Mobile | 320px - 639px | Phone |
| Tablet | 640px - 1023px | iPad |
| Desktop | 1024px+ | Desktop |

### Responsive Adjustments

**Mobile (< 640px)**
- Sidebar collapses to hamburger menu
- Single-column layouts
- Larger touch targets (48px minimum)
- Reduced padding (16px instead of 24px)
- Smaller fonts (scale down 10%)

**Tablet (640px - 1023px)**
- Sidebar visible but narrower (200px)
- Two-column layouts where applicable
- Medium padding (20px)
- Standard font sizes

**Desktop (> 1024px)**
- Full sidebar (240px)
- Multi-column layouts
- Generous padding (24px+)
- Full font sizes

---

## 9. Accessibility

### Color Contrast
- All text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid Charcoal (#1A1A1A);
  outline-offset: 2px;
}
```

### Keyboard Navigation
- Tab order follows visual flow
- All interactive elements keyboard-accessible
- Skip links for main content
- Visible focus indicators on all elements

### Screen Reader Support
- Semantic HTML (button, link, form, etc.)
- ARIA labels for icon-only buttons
- Form labels associated with inputs
- Heading hierarchy maintained
- Alt text for all images

---

## 10. Design Tokens

### CSS Variables
```css
:root {
  /* Colors */
  --color-cream: #F5F1E8;
  --color-charcoal: #1A1A1A;
  --color-slate: #4A4A4A;
  --color-taupe: #8B8680;
  --color-emerald: #2D5F4F;
  --color-amber: #C9A961;
  --color-crimson: #8B3A3A;
  --color-slate-blue: #4A5F7F;

  /* Typography */
  --font-serif-headline: 'Bodoni Moda', serif;
  --font-serif-body: 'Lora', serif;
  --font-sans: 'Inter', sans-serif;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(26, 26, 26, 0.08);
  --shadow-md: 0 4px 16px rgba(26, 26, 26, 0.12);
  --shadow-lg: 0 8px 32px rgba(26, 26, 26, 0.16);

  /* Borders */
  --border-radius-sm: 2px;
  --border-radius-md: 4px;
  --border-radius-lg: 8px;

  /* Transitions */
  --transition-fast: 120ms cubic-bezier(0.23, 1, 0.32, 1);
  --transition-normal: 200ms cubic-bezier(0.23, 1, 0.32, 1);
  --transition-slow: 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
```

---

## 11. Dark Mode Considerations

While the primary design is light mode, dark mode support follows:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-cream: #1A1A1A;
    --color-charcoal: #F5F1E8;
    --color-slate: #B8B8B8;
    --color-taupe: #7A7570;
    /* Invert other colors appropriately */
  }
}
```

---

## 12. Component Library

All components are built using shadcn/ui and Tailwind CSS with custom design tokens:

- Button (primary, secondary, status variants)
- Card (elevated, flat)
- Table (sortable, filterable)
- Form (input, select, textarea, checkbox, radio)
- Modal / Dialog
- Dropdown Menu
- Sidebar Navigation
- Breadcrumb
- Badge / Tag
- Alert / Toast
- Spinner / Skeleton
- Pagination
- Slider
- Tabs

---

## 13. Design System Documentation

### Figma File
- Component library with all variants
- Color palette and typography scales
- Layout grids and spacing guides
- Animation specifications
- Responsive breakpoint previews

### Implementation
- Tailwind CSS configuration with design tokens
- Custom CSS for editorial aesthetic
- Reusable React components in `client/src/components/`
- Global styles in `client/src/index.css`

---

**Document Owner:** Design & UX  
**Last Updated:** June 2026  
**Next Review:** July 2026
