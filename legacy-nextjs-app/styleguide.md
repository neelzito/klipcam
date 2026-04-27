# KlipCam Design System
*Creator AI Platform - TikTok-Inspired, Mobile-First Design*

## Brand Vision
**"Create 10 IG-ready images in under 5 minutes from 10 selfies"**

KlipCam empowers beginner creators with TikTok-inspired energy while maintaining elegant sophistication. Our design system balances bold creativity with approachable simplicity.

## Design Principles

### 1. **Creator Energy** 🎨
- Bold gradients and vibrant accents
- Playful micro-animations 
- Success celebrations and delightful moments
- TikTok-inspired visual language

### 2. **Beginner-Friendly** 🎯
- Large, thumb-optimized touch targets (44px minimum)
- Clear visual hierarchy with obvious primary actions
- Minimal text, maximum visual communication
- Progressive disclosure of advanced features

### 3. **Mobile-First Excellence** 📱
- Portrait orientation priority
- Thumb-reach zone optimization
- Swipe-friendly interactions
- One-handed operation support

### 4. **Elegant Simplicity** ✨
- Premium materials and subtle shadows
- Refined typography with perfect spacing
- Sophisticated color relationships
- Minimal cognitive load

---

## Typography System

### Primary Fonts
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Scale (Mobile-First)
```css
/* Display - Preset names, success messages */
.text-display { font-size: 32px; font-weight: 700; line-height: 1.1; }

/* Headline - Page titles, section headers */
.text-headline { font-size: 24px; font-weight: 600; line-height: 1.2; }

/* Title - Card titles, button labels */
.text-title { font-size: 18px; font-weight: 600; line-height: 1.3; }

/* Body - Main content, descriptions */
.text-body { font-size: 16px; font-weight: 400; line-height: 1.5; }

/* Caption - Meta info, timestamps, credits */
.text-caption { font-size: 14px; font-weight: 500; line-height: 1.4; }

/* Micro - Labels, badges */
.text-micro { font-size: 12px; font-weight: 500; line-height: 1.3; }
```

### Desktop Scaling (md+)
Scale all sizes by 1.2x on desktop while maintaining mobile-first hierarchy.

---

## Color System

### Primary Palette
```css
/* Brand Core - TikTok inspired */
--primary-50: #fef2ff;
--primary-100: #fce7ff;
--primary-200: #f9d0fe;
--primary-300: #f5a9fc;
--primary-400: #ee72f7;
--primary-500: #e434ed;  /* Main brand */
--primary-600: #c41ed1;
--primary-700: #a015ab;
--primary-800: #84158b;
--primary-900: #6d1571;

/* Secondary - Vibrant accent */
--secondary-50: #fff1f2;
--secondary-100: #ffe4e6;
--secondary-200: #fecdd3;
--secondary-300: #fda4af;
--secondary-400: #fb7185;
--secondary-500: #f43f5e;  /* Vibrant pink */
--secondary-600: #e11d48;
--secondary-700: #be123c;
--secondary-800: #9f1239;
--secondary-900: #881337;
```

### Creator Workflow Colors
```css
/* Success - Generation complete */
--success-500: #10b981;
--success-600: #059669;

/* Warning - Low credits */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error - Generation failed */
--error-500: #ef4444;
--error-600: #dc2626;

/* Info - Processing, queue */
--info-500: #3b82f6;
--info-600: #2563eb;
```

### Dark Theme (Primary)
```css
/* Background layers */
--bg-primary: #0a0a0a;      /* Main background */
--bg-secondary: #111111;    /* Cards, panels */
--bg-tertiary: #1a1a1a;     /* Elevated surfaces */
--bg-interactive: #222222;  /* Hover states */

/* Text hierarchy */
--text-primary: #ffffff;    /* Headlines, titles */
--text-secondary: #a3a3a3;  /* Body text */
--text-tertiary: #737373;   /* Captions, meta */
--text-inverse: #000000;    /* Text on light surfaces */

/* Borders and dividers */
--border-subtle: #262626;
--border-default: #404040;
--border-strong: #525252;
```

### Light Theme (Optional)
```css
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;
--bg-interactive: #e2e8f0;

--text-primary: #0f172a;
--text-secondary: #475569;
--text-tertiary: #64748b;
--text-inverse: #ffffff;

--border-subtle: #e2e8f0;
--border-default: #cbd5e1;
--border-strong: #94a3b8;
```

---

## Component System

### Buttons

#### Primary Button (CTA)
```tsx
// Main actions: "Generate", "Train LoRA", "Upgrade"
<button className="
  w-full h-14 px-6
  bg-gradient-to-r from-primary-500 to-secondary-500
  hover:from-primary-600 hover:to-secondary-600
  text-white font-semibold text-title
  rounded-2xl shadow-lg hover:shadow-xl
  transform hover:scale-[1.02] active:scale-[0.98]
  transition-all duration-200 ease-out
">
  Generate Magic ✨
</button>
```

#### Secondary Button
```tsx
// Supporting actions: "Preview", "Save", "Share"
<button className="
  h-12 px-5
  bg-bg-tertiary hover:bg-bg-interactive
  text-text-primary font-medium text-body
  rounded-xl border border-border-default
  hover:border-primary-400
  transition-all duration-200
">
  Preview
</button>
```

#### Ghost Button
```tsx
// Subtle actions: "Skip", "Later", navigation
<button className="
  h-10 px-4
  text-text-secondary hover:text-text-primary
  font-medium text-caption
  rounded-lg hover:bg-bg-secondary
  transition-all duration-150
">
  Skip for now
</button>
```

### Cards & Surfaces

#### Preset Card
```tsx
<div className="
  relative bg-bg-secondary
  rounded-2xl overflow-hidden
  shadow-sm hover:shadow-md
  transform hover:scale-[1.02]
  transition-all duration-300 ease-out
  group cursor-pointer
">
  {/* Thumbnail */}
  <div className="aspect-square relative overflow-hidden">
    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
    
    {/* Credit cost badge - subtle */}
    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
      <span className="text-white text-micro font-medium">4 credits</span>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-4">
    <h3 className="text-title font-semibold text-text-primary mb-1">Fashion Editorial</h3>
    <p className="text-caption text-text-secondary">High-fashion editorial style</p>
  </div>
</div>
```

#### Generation Card
```tsx
<div className="bg-bg-secondary rounded-2xl p-4 shadow-sm">
  {/* Status indicator */}
  <div className="flex items-center gap-2 mb-3">
    <div className="w-2 h-2 bg-info-500 rounded-full animate-pulse"></div>
    <span className="text-caption text-text-secondary">Generating...</span>
    <span className="text-caption text-text-tertiary ml-auto">~30s remaining</span>
  </div>
  
  {/* Progress bar */}
  <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden mb-4">
    <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500" 
         style="width: 65%"></div>
  </div>
  
  {/* Preview */}
  <div className="aspect-square bg-bg-tertiary rounded-xl flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
  </div>
</div>
```

### Navigation

#### Bottom Navigation (Mobile Primary)
```tsx
<nav className="
  fixed bottom-0 left-0 right-0 z-50
  bg-bg-secondary/80 backdrop-blur-xl
  border-t border-border-subtle
  px-4 py-2 pb-safe
">
  <div className="flex justify-around">
    {tabs.map(tab => (
      <button key={tab.id} className="
        flex flex-col items-center gap-1 py-2 px-4
        text-text-tertiary hover:text-text-primary
        transition-colors duration-200
      ">
        <Icon size={24} />
        <span className="text-micro font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
</nav>
```

#### Top Navigation (Desktop)
```tsx
<header className="
  sticky top-0 z-40
  bg-bg-primary/80 backdrop-blur-xl
  border-b border-border-subtle
">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg"></div>
      <span className="text-title font-bold text-text-primary">KlipCam</span>
    </div>
    
    {/* Credit balance - subtle */}
    <div className="flex items-center gap-4">
      <div className="px-3 py-1.5 bg-bg-tertiary rounded-lg">
        <span className="text-caption text-text-secondary">Credits: </span>
        <span className="text-caption font-semibold text-text-primary">247</span>
      </div>
    </div>
  </div>
</header>
```

---

## Mobile-First Responsive System

### Breakpoints
```css
/* Mobile-first approach */
/* xs: 0px    - Phone portrait */
/* sm: 480px  - Phone landscape */
/* md: 768px  - Tablet portrait */
/* lg: 1024px - Tablet landscape */
/* xl: 1280px - Desktop */
/* 2xl: 1536px - Large desktop */
```

### Grid System
```css
/* Mobile: Single column, full-width cards */
.grid-mobile { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 16px; 
}

/* Tablet: 2-column grid */
@media (min-width: 768px) {
  .grid-tablet { 
    grid-template-columns: repeat(2, 1fr); 
    gap: 20px; 
  }
}

/* Desktop: 3-4 column grid */
@media (min-width: 1024px) {
  .grid-desktop { 
    grid-template-columns: repeat(3, 1fr); 
    gap: 24px; 
  }
}
```

### Touch Targets
```css
/* Minimum touch target: 44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Primary actions: Larger for thumbs */
.touch-primary {
  min-height: 56px;
  padding: 16px 24px;
}
```

---

## Animation System

### Micro-Interactions
```css
/* Hover effects */
.hover-lift {
  transform: translateY(0);
  transition: transform 200ms ease-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Button press feedback */
.press-feedback {
  transition: transform 150ms ease-out;
}
.press-feedback:active {
  transform: scale(0.98);
}

/* Success celebration */
@keyframes celebrate {
  0% { transform: scale(1); }
  50% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.celebrate {
  animation: celebrate 600ms ease-out;
}
```

### Loading States
```css
/* Pulse animation for loading content */
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Spinner for processing */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--bg-tertiary);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

---

## Creator-Specific Patterns

### Preset Selection Grid
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
  {presets.map(preset => (
    <PresetCard
      key={preset.id}
      preset={preset}
      selected={selectedPreset === preset.id}
      onSelect={() => setSelectedPreset(preset.id)}
    />
  ))}
</div>
```

### Aspect Ratio Selector
```tsx
<div className="flex gap-2 p-4 overflow-x-auto">
  {aspectRatios.map(ratio => (
    <button
      key={ratio.id}
      className={`
        flex-shrink-0 px-4 py-2 rounded-xl
        border-2 transition-all duration-200
        ${selected === ratio.id 
          ? 'border-primary-500 bg-primary-500/10 text-primary-400' 
          : 'border-border-default text-text-secondary hover:border-border-strong'
        }
      `}
    >
      <div className="text-caption font-medium">{ratio.label}</div>
      <div className="text-micro text-text-tertiary">{ratio.dimensions}</div>
    </button>
  ))}
</div>
```

### Credit Cost Display (Subtle)
```tsx
<div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
  <div>
    <h3 className="text-title font-semibold text-text-primary">Premium Generation</h3>
    <p className="text-caption text-text-secondary">FLUX.1-dev + Style enhancement</p>
  </div>
  
  <div className="text-right">
    <div className="text-caption text-text-tertiary">Cost</div>
    <div className="text-body font-semibold text-text-primary">8 credits</div>
  </div>
</div>
```

### Success Moment
```tsx
<div className="text-center py-8 animate-fade-in">
  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center celebrate">
    <CheckIcon className="w-8 h-8 text-white" />
  </div>
  
  <h2 className="text-headline font-bold text-text-primary mb-2">
    Magic Created! ✨
  </h2>
  
  <p className="text-body text-text-secondary mb-6">
    Your IG-ready images are ready to download
  </p>
  
  <button className="primary-button">
    View Results
  </button>
</div>
```

---

## Implementation Guidelines

### CSS Custom Properties Setup
```css
:root {
  /* Import all color variables */
  /* Import spacing scale */
  /* Import typography scale */
  /* Import animation timings */
}

/* Dark theme (default) */
[data-theme="dark"] {
  /* Dark theme variables */
}

/* Light theme (optional) */
[data-theme="light"] {
  /* Light theme variables */
}
```

### Tailwind Configuration
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Import KlipCam color system
        primary: { /* ... */ },
        secondary: { /* ... */ },
        // etc.
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Import typography scale
      },
      spacing: {
        // Custom spacing for creator UI
        'safe': 'env(safe-area-inset-bottom)',
      },
      animation: {
        // Custom animations
        'celebrate': 'celebrate 600ms ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      }
    }
  },
  plugins: []
}
```

### Component Architecture
```tsx
// Base component with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

// Compound components for complex patterns
export const PresetGrid = {
  Root: PresetGridRoot,
  Card: PresetCard,
  LoadingCard: PresetLoadingCard,
}

// Creator-specific hooks
export const useCreatorWorkflow = () => {
  // Generation state management
  // Credit calculations  
  // Progress tracking
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance
- Minimum contrast ratio 4.5:1 for normal text
- Minimum contrast ratio 3:1 for large text
- Touch targets minimum 44x44px
- Focus indicators on all interactive elements
- Screen reader support with proper ARIA labels

### Creator-Friendly Accessibility
- Large, clear typography optimized for mobile
- High contrast mode support
- Voice-over friendly image generation descriptions
- Simple navigation patterns for cognitive accessibility

---

This design system empowers creators with TikTok energy while maintaining elegant sophistication. Every component is designed mobile-first for thumb-friendly creation workflows, with subtle credit integration and beginner-friendly patterns throughout.